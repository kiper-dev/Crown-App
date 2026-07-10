export function Chart({
  days,
  peakValue,
  peakLabel,
  axis,
}: {
  days: number[];
  peakValue: number;
  peakLabel: string;
  axis: string[];
}) {
  const max = Math.max(peakValue, ...days) || 1;
  return (
    <>
      <div className="chart" aria-hidden>
        {days.map((v, i) => {
          const peak = v === peakValue;
          return (
            <div className={`col${peak ? " peak" : ""}`} key={i}>
              <div className="b" style={{ height: `${Math.max((v / max) * 100, v ? 4 : 2)}%` }} />
              {peak ? <span className="peak-tag num">{peakLabel}</span> : null}
            </div>
          );
        })}
      </div>
      <div className="axis num">
        {axis.map((a) => (
          <span key={a}>{a}</span>
        ))}
      </div>
    </>
  );
}
