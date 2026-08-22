"use client";

import { useEffect, useState } from "react";

import type { LifeAdminReminderItem } from "@/components/tools/LifeAdminReminder";

type PushAccess = {
  subscriptionId: string;
  managementToken: string;
};

type PublicKeyResponse = { publicKey?: string; error?: string };
type AccessResponse = PushAccess & { error?: string };

const accessStorageKey = "hoju-compass-push-access-v1";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function minimalReminders(items: LifeAdminReminderItem[]) {
  return items.map(({ id, title, category, date, leadDays }) => ({ id, title, category, date, leadDays }));
}

export function PushReminderManager({ reminders }: { reminders: LifeAdminReminderItem[] }) {
  const [access, setAccess] = useState<PushAccess | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(accessStorageKey) ?? "null") as PushAccess | null;
      if (saved?.subscriptionId && saved.managementToken) setAccess(saved);
    } catch {
      localStorage.removeItem(accessStorageKey);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !access) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/push/reminders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...access, reminders: minimalReminders(reminders) }),
        });
        if (response.status === 401) {
          localStorage.removeItem(accessStorageKey);
          setAccess(null);
          setStatus("알림 연결이 만료됐습니다. 다시 연결해 주세요.");
          return;
        }
        if (!response.ok) throw new Error();
        setStatus("저장한 일정과 푸시 알림을 맞췄습니다.");
      } catch {
        setStatus("일정은 이 기기에 저장됐지만 푸시 알림 동기화는 실패했습니다. 잠시 뒤 다시 시도해 주세요.");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [access, loaded, reminders]);

  async function enablePush() {
    if (!pushSupported()) {
      setStatus("이 브라우저는 웹 푸시를 지원하지 않습니다. iPhone은 Safari에서 홈 화면에 추가한 뒤 다시 열어 주세요.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const keyResponse = await fetch("/api/push/public-key", { cache: "no-store" });
      const keyBody = await keyResponse.json() as PublicKeyResponse;
      if (!keyResponse.ok || !keyBody.publicKey) throw new Error(keyBody.error || "푸시 리마인더를 준비하고 있습니다.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("알림 권한이 허용되지 않았습니다. 브라우저나 기기 설정에서 Hoju Compass 알림을 허용한 뒤 다시 시도해 주세요.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(keyBody.publicKey),
      });
      const serialized = subscription.toJSON();
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) throw new Error("기기 알림 정보를 읽지 못했습니다.");

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: { endpoint: serialized.endpoint, keys: serialized.keys },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const body = await response.json() as AccessResponse;
      if (!response.ok || !body.subscriptionId || !body.managementToken) {
        throw new Error(body.error || "알림을 연결하지 못했습니다.");
      }

      const nextAccess = { subscriptionId: body.subscriptionId, managementToken: body.managementToken };
      localStorage.setItem(accessStorageKey, JSON.stringify(nextAccess));
      setAccess(nextAccess);
      setStatus("알림을 연결했습니다. 방금 도착한 시험 알림을 확인해 주세요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "알림을 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    if (!access) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/push/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(access),
      });
      if (!response.ok && response.status !== 404) throw new Error();
      if (pushSupported()) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        await subscription?.unsubscribe();
      }
      localStorage.removeItem(accessStorageKey);
      setAccess(null);
      setStatus("푸시 알림과 서버에 보관된 일정을 삭제했습니다.");
    } catch {
      setStatus("알림 정보를 삭제하지 못했습니다. 연결이 안정된 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return <section aria-labelledby="push-reminder-heading" className="mt-10 border-t-2 border-gold bg-surface p-6 sm:p-8 lg:col-span-2">
    <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Optional push reminder</p>
        <h2 id="push-reminder-heading" className="mt-2 text-2xl font-semibold text-navy">캘린더를 놓쳐도, 이 기기로 한 번 더 알려드릴게요.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">원할 때만 켤 수 있습니다. 알림을 켜면 일정 이름·분류·날짜·며칠 전 알림인지와 기기 푸시 주소만 서버에 보관합니다. 메모와 여권·비자·차량 번호는 전송하지 않습니다.</p>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted">iPhone·iPad는 Safari에서 Hoju Compass를 홈 화면에 추가하고 설치된 앱으로 열어야 푸시 알림을 켤 수 있습니다. 기기와 브라우저 정책에 따라 도착 시각이 조금 달라질 수 있습니다.</p>
      </div>
      <div className="flex flex-wrap gap-3 lg:justify-end">
        {access ? <button type="button" onClick={disablePush} disabled={busy} className="min-h-12 border border-navy px-5 text-sm font-semibold text-navy disabled:cursor-wait disabled:opacity-60">{busy ? "처리 중…" : "푸시 알림 끄고 삭제"}</button> : <button type="button" onClick={enablePush} disabled={busy || !loaded} className="min-h-12 bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light disabled:cursor-wait disabled:opacity-60">{busy ? "연결 중…" : "이 기기에서 푸시 알림 켜기"}</button>}
      </div>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4 text-xs leading-5 text-muted">
      <strong className="text-navy">{access ? "현재 이 기기 알림 켜짐" : "현재 푸시 알림 꺼짐"}</strong>
      <span>끄기를 누르면 서버의 기기 주소와 알림 일정도 함께 삭제됩니다.</span>
      <a href="/privacy" className="font-semibold text-navy underline decoration-gold underline-offset-4">개인정보 안내</a>
    </div>
    <p className="mt-3 min-h-5 text-xs text-muted" aria-live="polite">{status}</p>
  </section>;
}
