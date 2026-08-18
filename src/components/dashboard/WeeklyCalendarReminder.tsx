"use client";

import { useState } from "react";

const weekdays = [
  { value: 1, code: "MO", label: "월요일" },
  { value: 3, code: "WE", label: "수요일" },
  { value: 0, code: "SU", label: "일요일" },
] as const;

const reminderTimes = ["18:00", "19:00", "20:00"] as const;

function calendarTimestamp(date: Date, utc = false) {
  const value = utc ? new Date(date.toISOString()) : date;
  const year = utc ? value.getUTCFullYear() : value.getFullYear();
  const month = (utc ? value.getUTCMonth() : value.getMonth()) + 1;
  const day = utc ? value.getUTCDate() : value.getDate();
  const hour = utc ? value.getUTCHours() : value.getHours();
  const minute = utc ? value.getUTCMinutes() : value.getMinutes();
  const second = utc ? value.getUTCSeconds() : value.getSeconds();
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}${pad(second)}${utc ? "Z" : ""}`;
}

function nextOccurrence(weekday: number, time: string) {
  const now = new Date();
  const [hour, minute] = time.split(":").map(Number);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  let daysAhead = (weekday - now.getDay() + 7) % 7;
  if (daysAhead === 0 && next.getTime() <= now.getTime()) daysAhead = 7;
  next.setDate(next.getDate() + daysAhead);
  return next;
}

function createCalendarFile(weekday: number, weekdayCode: string, time: string) {
  const createdAt = new Date();
  const start = nextOccurrence(weekday, time);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hoju Compass//Weekly Reading Reminder//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:weekly-reading-${weekdayCode}-${time.replace(":", "")}@hojucompass.com`,
    `DTSTAMP:${calendarTimestamp(createdAt, true)}`,
    `DTSTART:${calendarTimestamp(start)}`,
    "DURATION:PT20M",
    `RRULE:FREQ=WEEKLY;BYDAY=${weekdayCode}`,
    "SUMMARY:Hoju Compass 이번 주 실용 자료 읽기",
    "DESCRIPTION:이번 주 읽기 목표를 확인하고 다음 호주 생활 실용 자료를 읽어보세요.\\nhttps://hojucompass.com/my-compass",
    "URL:https://hojucompass.com/my-compass",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hoju Compass 읽기 목표를 확인할 시간입니다.",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function WeeklyCalendarReminder() {
  const [weekday, setWeekday] = useState(0);
  const [time, setTime] = useState<(typeof reminderTimes)[number]>("19:00");
  const [message, setMessage] = useState("");

  const downloadReminder = () => {
    const selectedDay = weekdays.find((day) => day.value === weekday) ?? weekdays[2];
    const contents = createCalendarFile(selectedDay.value, selectedDay.code, time);
    const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hoju-compass-weekly-reading.ics";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage(`${selectedDay.label} ${time} 일정 파일을 만들었어요. 내려받은 파일을 열면 캘린더에 저장할 수 있어요.`);
  };

  return (
    <div className="mt-7 border-t border-white/15 pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">잊지 않도록</p>
      <h3 className="mt-1 text-lg font-semibold">내 캘린더에 읽는 시간 남기기</h3>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <label>
          <span className="sr-only">반복 요일</span>
          <select
            value={weekday}
            onChange={(event) => setWeekday(Number(event.target.value))}
            className="min-h-11 w-full border border-white/20 bg-navy px-3 text-sm text-white outline-none focus:border-gold"
          >
            {weekdays.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">반복 시간</span>
          <select
            value={time}
            onChange={(event) => setTime(event.target.value as (typeof reminderTimes)[number])}
            className="min-h-11 w-full border border-white/20 bg-navy px-3 text-sm text-white outline-none focus:border-gold"
          >
            {reminderTimes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <button type="button" onClick={downloadReminder} className="mt-3 inline-flex min-h-11 w-full items-center justify-center border border-gold px-3 text-sm font-semibold text-white transition hover:bg-gold hover:text-navy">
        캘린더 일정 파일 받기
      </button>
      <p className="mt-3 text-xs leading-5 text-white/55">
        파일을 열면 사용하는 캘린더 앱에 매주 반복 일정을 넣을 수 있어요. 알림은 캘린더 앱에서 보내며 Hoju Compass는 이메일을 보내지 않아요.
      </p>
      {message && <p className="mt-3 border-l-2 border-gold pl-3 text-xs leading-5 text-white/75" role="status">{message}</p>}
    </div>
  );
}
