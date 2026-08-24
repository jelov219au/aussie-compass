export function ResumeProWorkspaceEntryGuide({ accessProtected }: { accessProtected: boolean }) {
  return (
    <section className="mt-9 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="resume-pro-workspace-entry-heading">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            {accessProtected ? "이용권 연결 완료" : "개발 프리뷰"}
          </p>
          <h2 id="resume-pro-workspace-entry-heading" className="mt-2 text-2xl font-semibold text-navy">첫 작업은 이 순서로 시작하세요.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">먼저 아래 첫 10분 빠른 시작에서 이 기기에 저장된 이력서를 확인하세요. 지원 자료를 만든 뒤에는 브라우저를 바꾸기 전에 1회용 복구 코드를 보관해 두면 돼요.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <a href="#resume-pro-workspace" className="inline-flex min-h-11 items-center justify-center bg-navy px-4 text-sm font-semibold text-white">첫 작업 시작하기 ↓</a>
          {accessProtected && <a href="#resume-pro-access" className="inline-flex min-h-11 items-center justify-center border border-navy px-4 text-sm font-semibold text-navy">복구 코드 위치 보기 ↓</a>}
        </div>
      </div>
      <p className="mt-5 border-l-2 border-gold bg-surface p-3 text-xs leading-5 text-muted">이력서와 채용 공고 원문은 이 기기의 브라우저 안에서만 처리합니다. 이용권 연결과 작성 데이터 백업은 서로 다른 절차예요.</p>
    </section>
  );
}
