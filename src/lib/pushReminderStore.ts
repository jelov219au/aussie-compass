import "server-only";

import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import { getEntitlementDatabaseUrl } from "@/lib/entitlementConfig";

export type PushReminderInput = {
  id: string;
  title: string;
  category: string;
  date: string;
  leadDays: number;
};

export type PushSubscriptionInput = {
  publicId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  managementToken: string;
};

export type DuePushReminder = {
  reminderId: string;
  subscriptionId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  category: string;
  dueDate: string;
  leadDays: number;
  triggerDate: string;
};

function getConnectionString() {
  const value = getEntitlementDatabaseUrl();
  if (!value || (!value.startsWith("postgres://") && !value.startsWith("postgresql://"))) {
    throw new Error("The push-reminder database is not configured.");
  }
  return value;
}

function sqlClient() {
  return neon(getConnectionString());
}

export function hashPushSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function upsertPushSubscription(input: PushSubscriptionInput) {
  const sql = sqlClient();
  const rows = await sql`
    insert into push_subscriptions (
      public_id,
      endpoint_hash,
      endpoint,
      p256dh,
      auth,
      timezone,
      management_token_hash,
      active,
      updated_at,
      deactivated_at
    ) values (
      ${input.publicId},
      ${hashPushSecret(input.endpoint)},
      ${input.endpoint},
      ${input.p256dh},
      ${input.auth},
      ${input.timezone},
      ${hashPushSecret(input.managementToken)},
      true,
      now(),
      null
    )
    on conflict (endpoint_hash) do update set
      public_id = excluded.public_id,
      endpoint = excluded.endpoint,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      timezone = excluded.timezone,
      management_token_hash = excluded.management_token_hash,
      active = true,
      updated_at = now(),
      deactivated_at = null
    returning public_id::text
  ` as { public_id: string }[];

  if (!rows[0]) throw new Error("The push subscription could not be stored.");
  return rows[0].public_id;
}

export async function replacePushReminders(input: {
  publicId: string;
  managementToken: string;
  reminders: PushReminderInput[];
}) {
  const sql = sqlClient();
  const payload = JSON.stringify(input.reminders);
  const rows = await sql`
    with target as (
      select id
      from push_subscriptions
      where public_id = ${input.publicId}::uuid
        and management_token_hash = ${hashPushSecret(input.managementToken)}
        and active = true
    ), removed as (
      delete from push_reminders
      where subscription_id in (select id from target)
      returning id
    ), incoming as (
      select *
      from jsonb_to_recordset(${payload}::jsonb) as reminder(
        id uuid,
        title text,
        category text,
        date date,
        "leadDays" integer
      )
    ), inserted as (
      insert into push_reminders (
        subscription_id,
        reminder_key,
        title,
        category,
        due_date,
        lead_days
      )
      select target.id, incoming.id, incoming.title, incoming.category, incoming.date, incoming."leadDays"
      from target cross join incoming
      returning id
    )
    select
      exists(select 1 from target) as authorised,
      (select count(*)::integer from inserted) as reminder_count
  ` as { authorised: boolean; reminder_count: number }[];

  return rows[0] ?? { authorised: false, reminder_count: 0 };
}

export async function deletePushSubscription(publicId: string, managementToken: string) {
  const sql = sqlClient();
  const rows = await sql`
    delete from push_subscriptions
    where public_id = ${publicId}::uuid
      and management_token_hash = ${hashPushSecret(managementToken)}
    returning id
  ` as { id: string | number | bigint }[];
  return Boolean(rows[0]);
}

export async function deletePushSubscriptionByPublicId(publicId: string) {
  const sql = sqlClient();
  await sql`delete from push_subscriptions where public_id = ${publicId}::uuid`;
}

export async function findDuePushReminders(limit = 200) {
  const sql = sqlClient();
  const rows = await sql`
    select
      reminder.id::text as reminder_id,
      subscription.id::text as subscription_id,
      subscription.endpoint,
      subscription.p256dh,
      subscription.auth,
      reminder.title,
      reminder.category,
      reminder.due_date::text,
      reminder.lead_days,
      (reminder.due_date - reminder.lead_days)::text as trigger_date
    from push_reminders reminder
    join push_subscriptions subscription on subscription.id = reminder.subscription_id
    where subscription.active = true
      and (reminder.due_date - reminder.lead_days) <= (now() at time zone subscription.timezone)::date
      and reminder.due_date >= (now() at time zone subscription.timezone)::date
      and reminder.last_sent_for is distinct from (reminder.due_date - reminder.lead_days)
    order by reminder.due_date asc, reminder.id asc
    limit ${limit}
  ` as {
    reminder_id: string;
    subscription_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    title: string;
    category: string;
    due_date: string;
    lead_days: number;
    trigger_date: string;
  }[];

  return rows.map((row) => ({
    reminderId: row.reminder_id,
    subscriptionId: row.subscription_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    title: row.title,
    category: row.category,
    dueDate: row.due_date,
    leadDays: row.lead_days,
    triggerDate: row.trigger_date,
  } satisfies DuePushReminder));
}

export async function markPushReminderSent(reminderId: string, triggerDate: string) {
  const sql = sqlClient();
  await sql`
    update push_reminders
    set last_sent_for = ${triggerDate}::date, updated_at = now()
    where id = ${reminderId}::bigint
  `;
}

export async function deactivatePushSubscription(subscriptionId: string) {
  const sql = sqlClient();
  await sql`
    delete from push_subscriptions
    where id = ${subscriptionId}::bigint
  `;
}

export async function markPushSubscriptionSuccessful(subscriptionId: string) {
  const sql = sqlClient();
  await sql`
    update push_subscriptions
    set last_success_at = now(), updated_at = now()
    where id = ${subscriptionId}::bigint
  `;
}
