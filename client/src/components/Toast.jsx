export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-[22px] right-[22px] z-[70] max-w-[90vw] rounded-[10px] bg-[#172542] px-4 py-3 text-[12px] font-bold text-white shadow-card">
      ✓ {message}
    </div>
  );
}