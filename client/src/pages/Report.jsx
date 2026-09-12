import Heading from "../components/Heading";
import Map from "../components/Map";
import { CATEGORIES } from "../lib/constants";

export default function Report({ form, setForm, submit, images, setImages, addImages }) {
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <>
      <Heading title="Report a civic issue" sub="Describe what you see — we’ll turn it into action." />
      <form onSubmit={submit} className="grid gap-[18px] xl:grid-cols-[1fr_.86fr]">
        <div className="card p-[22px]">
          <h2 className="m-0 font-display text-[17px] font-extrabold">Tell us what happened</h2>
          <p className="mb-5 mt-1 text-[12px] text-[#66748e]">CivicPulse uses your report to classify, prioritize and route the issue.</p>
          <label className="field">Issue title <em className="not-italic text-[#de4e54]">*</em>
            <input required name="title" value={form.title} onChange={change} placeholder="e.g. Deep pothole near Maple School" />
          </label>
          <label className="field">Describe the issue <em className="not-italic text-[#de4e54]">*</em>
            <textarea required name="description" value={form.description} onChange={change} placeholder="What happened? Who is affected? Add useful details for the city team." />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">Issue type
              <select name="category" value={form.category} onChange={change}>
                <option value="">Let AI classify it</option>
                {CATEGORIES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <label className="field">Add photos <span className="font-normal text-[#8995a9]">(up to 3)</span>
            <span className="mt-1.5 block cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-[#bfc9dc] bg-[#fafbfe] p-5 text-center text-[#718097]">
              <input className="hidden" type="file" accept="image/*" multiple onChange={addImages} />
              <b className="block text-[12px] text-[#4d5d76]">{images.length ? `${images.length} of 3 images selected` : "Upload up to 3 images"}</b>
              <small>JPG, PNG or HEIC · up to 10MB each</small>
            </span>
          </label>
          {images.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {images.map((image, i) => (
                <div key={i} className="relative">
                  <img src={image.url} alt={image.name} className={`h-16 w-16 rounded-lg object-cover ${image.status === "uploading" ? "opacity-50" : ""}`} />
                  {image.status === "uploading" && (
                    <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/20 text-center text-[9px] font-bold text-white">Uploading…</span>
                  )}
                  <button type="button" onClick={() => setImages(images.filter((_, x) => x !== i))} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#172542] text-xs text-white">×</button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-[12px] font-bold">
            <input className="w-auto" type="checkbox" name="nearSchool" checked={form.nearSchool} onChange={change} />
            This is near a school or high-risk location
          </label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <small className="max-w-[250px] text-[10px] text-[#7a879a]">Your report will be analyzed for category, urgency, duplicates and routing.</small>
            <button className="primary" disabled={images.some((x) => x.status === "uploading")}>
              {images.some((x) => x.status === "uploading") ? "Uploading photos…" : "Analyze & submit →"}
            </button>
          </div>
        </div>
        <div className="card p-[22px]">
          <h2 className="m-0 font-display text-[17px] font-extrabold">Pin the location</h2>
          <p className="mb-5 mt-1 text-[12px] text-[#66748e]">Click anywhere on the live map to place your issue marker.</p>
          {/* Fixed: previously closed over a stale `form` from render time */}
          <Map className="h-[250px] rounded-[11px]" onLocation={(location) => setForm((f) => ({ ...f, location }))} />
          <label className="field mt-4">Ward
            <input name="ward" value={form.ward} onChange={change} />
          </label>
          <div className="mt-6 rounded-[10px] bg-[#f4f6ff] p-3.5">
            <b className="text-[12px]">✦ What happens next?</b>
            <p className="mb-0 mt-1.5 text-[11px] leading-relaxed text-[#728099]">CivicPulse checks nearby reports, calculates urgency, and routes the issue to the right city team.</p>
          </div>
        </div>
      </form>
    </>
  );
}