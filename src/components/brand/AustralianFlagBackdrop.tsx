const starPath = "m0-11 2.7 6.3 6.8.7-5.2 4.5 1.6 6.7L0 5.8l-5.9 3.5 1.6-6.7-5.2-4.5 6.8-.7L0-11Z";

export function AustralianFlagBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        className="australia-flag-backdrop absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <linearGradient id="flag-field" x1="1080" y1="0" x2="410" y2="760" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1A2744" stopOpacity="0.095" />
            <stop offset="0.62" stopColor="#315E73" stopOpacity="0.025" />
            <stop offset="1" stopColor="#EDF3F2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flag-red" x1="0" y1="0" x2="460" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A94B3D" stopOpacity="0.15" />
            <stop offset="1" stopColor="#A94B3D" stopOpacity="0.035" />
          </linearGradient>
        </defs>

        <path d="M575-40h925v840H310c182-93 262-233 265-420V-40Z" fill="url(#flag-field)" />

        <g className="australia-union-mark" opacity="0.34" transform="translate(-115 -55)">
          <path d="M-48 10 438 326M438 10-48 326" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="42" />
          <path d="M-48 10 438 326M438 10-48 326" stroke="url(#flag-red)" strokeWidth="16" />
          <path d="M195-35v405M-55 168h510" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="70" />
          <path d="M195-35v405M-55 168h510" stroke="#A94B3D" strokeOpacity="0.12" strokeWidth="28" />
        </g>

        <g className="australia-background-stars" fill="#C4A035" opacity="0.28">
          <path transform="translate(328 514) scale(1.35)" d={starPath} />
          <path transform="translate(1120 126)" d={starPath} />
          <path transform="translate(1015 258) scale(.82)" d={starPath} />
          <path transform="translate(1164 392) scale(1.12)" d={starPath} />
          <path transform="translate(1045 555) scale(.9)" d={starPath} />
          <path transform="translate(1280 472) scale(.7)" d={starPath} />
        </g>
        <path d="M1120 126 1015 258l149 134-119 163M1164 392l116 80" stroke="#1A2744" strokeOpacity="0.07" strokeWidth="2" />
      </svg>

      <div className="australia-horizon-glow absolute -bottom-32 right-[8%] h-72 w-[42rem] max-w-[80vw] rounded-[50%] bg-[#d5b965]/12 blur-3xl" />
    </div>
  );
}
