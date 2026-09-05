export function ListChecks({ id }: { id: string }) {
  return (
    <g id={id} stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6.5L5 8.5L9 4.5" />
      <path d="M3 17.5L5 19.5L9 15.5" />
      <path d="M12.5 6.5H21" />
      <path d="M12.5 12H21" />
      <path d="M12.5 17.5H21" />
    </g>
  );
}
