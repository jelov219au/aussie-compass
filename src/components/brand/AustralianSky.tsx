export function AustralianSky() {
  return (
    <div
      className="relative isolate min-h-[24rem] overflow-hidden rounded-[2rem] bg-navy px-6 py-7 text-white shadow-[0_28px_70px_rgba(26,39,68,0.16)] sm:min-h-[27rem] sm:px-8 sm:py-9"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.12),transparent_26%),linear-gradient(145deg,transparent_22%,rgba(86,126,150,0.26)_100%)]" />

      <svg
        viewBox="0 0 320 250"
        className="absolute inset-x-0 top-0 h-[68%] w-full"
        fill="none"
      >
        <path d="M213 41 174 93l54 51-32 63" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <path d="m174 93-53 42" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <path d="m228 144 52 19" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <g fill="#F4D36A">
          <path d="m213 32 2.7 6.4 6.9.6-5.3 4.5 1.6 6.8-5.9-3.6-5.9 3.6 1.6-6.8-5.3-4.5 6.9-.6L213 32Z" />
          <path d="m174 84 2.7 6.4 6.9.6-5.3 4.5 1.6 6.8-5.9-3.6-5.9 3.6 1.6-6.8-5.3-4.5 6.9-.6 2.7-6.4Z" />
          <path d="m228 135 2.7 6.4 6.9.6-5.3 4.5 1.6 6.8-5.9-3.6-5.9 3.6 1.6-6.8-5.3-4.5 6.9-.6 2.7-6.4Z" />
          <path d="m196 198 2.7 6.4 6.9.6-5.3 4.5 1.6 6.8-5.9-3.6-5.9 3.6 1.6-6.8-5.3-4.5 6.9-.6 2.7-6.4Z" />
          <path d="m280 154 2.2 5.1 5.5.5-4.2 3.6 1.3 5.4-4.8-2.8-4.7 2.8 1.3-5.4-4.2-3.6 5.5-.5 2.1-5.1Z" />
        </g>
      </svg>

      <div className="relative flex items-center justify-between gap-4 text-[0.65rem] font-semibold tracking-[0.18em] text-white/65">
        <span>HOJU COMPASS</span>
        <span>AUSTRALIA</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[54%] bg-[#6f9aa4]">
        <div className="absolute -top-8 left-[12%] h-28 w-28 rounded-full bg-[#efd28a] sm:h-32 sm:w-32" />
        <svg viewBox="0 0 420 100" preserveAspectRatio="none" className="absolute -top-10 h-20 w-full fill-[#d78b61]">
          <path d="M0 68C70 42 112 75 180 48c76-30 120-5 240-48v100H0V68Z" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-[88%] bg-[#f4ead8] px-6 pb-7 pt-5 text-navy sm:h-[87%] sm:px-8 sm:pb-8 sm:pt-6">
          <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[#9e593b]">START HERE, STAY READY</p>
          <p className="mt-2 max-w-[15rem] text-xl font-semibold leading-snug tracking-[-0.02em] sm:text-2xl">처음 도착하는 날부터<br />돌아가는 날까지</p>
          <p className="mt-2 text-[0.66rem] font-medium leading-5 tracking-[0.08em] text-navy/55">
            NSW · VIC · QLD · WA<br />SA · TAS · ACT · NT
          </p>
        </div>
      </div>
    </div>
  );
}
