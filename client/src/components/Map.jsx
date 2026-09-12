import { useEffect, useRef } from "react";

const valid = (location) => Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);

export default function Map({ className = "", onLocation, initialLocation, issues = [], onLocationStatus }) {
  const target = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const issueMarkers = useRef([]);
  const onLocationRef = useRef(onLocation);
  const statusRef = useRef(onLocationStatus);

  useEffect(() => {
    onLocationRef.current = onLocation;
    statusRef.current = onLocationStatus;
  }, [onLocation, onLocationStatus]);

  const placeMarker = (location, recenter = false) => {
    if (!map.current || !valid(location)) return;
    const point = [location.latitude, location.longitude];
    if (!marker.current) marker.current = window.L.marker(point).addTo(map.current);
    else marker.current.setLatLng(point);
    if (recenter) map.current.setView(point, 16);
  };

  useEffect(() => {
    if (!target.current || !window.L || map.current) return;
    const leafletMap = window.L.map(target.current, { scrollWheelZoom: false }).setView([23.0225, 72.5714], 13);
    map.current = leafletMap;
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(leafletMap);

    leafletMap.on("click", (event) => {
      const location = { latitude: event.latlng.lat, longitude: event.latlng.lng };
      placeMarker(location);
      onLocationRef.current?.(location);
      statusRef.current?.("Location pinned on the map.");
    });

    if (onLocation && navigator.geolocation) {
      statusRef.current?.("Finding your current location…");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          placeMarker(location, true);
          onLocationRef.current?.(location);
          statusRef.current?.("Using your current location. You can still click the map to adjust it.");
        },
        () => statusRef.current?.("Location access was unavailable. Click the map to pin the issue manually."),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    } else if (onLocation) {
      statusRef.current?.("Click the map to pin the issue location.");
    }

    return () => {
      leafletMap.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (valid(initialLocation)) placeMarker(initialLocation);
  }, [initialLocation?.latitude, initialLocation?.longitude]);

  useEffect(() => {
    if (!map.current || !window.L) return;
    issueMarkers.current.forEach((item) => item.remove());
    issueMarkers.current = issues
      .filter((issue) => valid(issue.location))
      .map((issue) => {
        const item = window.L.marker([issue.location.latitude, issue.location.longitude]).addTo(map.current);
        const popup = document.createElement("strong");
        popup.textContent = issue.title;
        item.bindPopup(popup);
        return item;
      });
  }, [issues]);

  return <div ref={target} className={`overflow-hidden ${className}`} />;
}