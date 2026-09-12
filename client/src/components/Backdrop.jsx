// Used by the Drawer, which previously had no backdrop at all — content
// behind it could peek out and look clipped/broken. Analysis/Notifications
// already had their own opaque overlay, so they don't use this.
export default function Backdrop({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-x-0 bottom-0 top-[68px] z-40 bg-[#0c1730]/40 backdrop-blur-[1px]"
    />
  );
}