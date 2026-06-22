import { Stage } from './Stage';
import { Globe } from './Globe';
import { useStore } from '@/store/useStore';

/** The full landing globe scene: camera, lighting, Earth, and host-city pins. */
export function GlobeScene() {
  const cities = useStore((s) => s.cities);
  const selectedCityId = useStore((s) => s.selectedCityId);
  const selectCity = useStore((s) => s.selectCity);

  return (
    <Stage
      cameraPosition={[0, 0.4, 6]}
      fov={42}
      orbit={{
        enableZoom: true,
        enablePan: false,
        minDistance: 3.4,
        maxDistance: 9,
        autoRotate: false,
      }}
    >
      <Globe
        cities={cities}
        selectedCityId={selectedCityId}
        onSelectCity={(id) => selectCity(id === selectedCityId ? null : id)}
      />
    </Stage>
  );
}
