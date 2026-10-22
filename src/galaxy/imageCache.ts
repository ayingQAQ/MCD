/** Keep decoded source images across scene visits, never WebGL resources or contexts. */
export function createImageCache(load: (url: string) => Promise<HTMLImageElement>, maxEntries = 32, maxBytes = 8 * 1024 * 1024) {
  const images = new Map<string, { image: HTMLImageElement; bytes: number }>();
  const pending = new Map<string, Promise<HTMLImageElement>>();
  let bytes = 0;
  return {
    get(url: string): Promise<HTMLImageElement> {
      const cached = images.get(url);
      if (cached) {
        images.delete(url); images.set(url, cached);
        return Promise.resolve(cached.image);
      }
      const loading = pending.get(url);
      if (loading) return loading;
      const promise = load(url).then(image => {
        const weight = image.naturalWidth * image.naturalHeight * 4;
        if (weight > 0 && weight <= maxBytes && maxEntries > 0) {
          images.set(url, { image, bytes: weight }); bytes += weight;
          while (images.size > maxEntries || bytes > maxBytes) {
            const oldest = images.keys().next().value!;
            bytes -= images.get(oldest)!.bytes; images.delete(oldest);
          }
        }
        return image;
      }).finally(() => pending.delete(url));
      pending.set(url, promise);
      return promise;
    },
    stats: () => ({ entries: images.size, bytes, pending: pending.size }),
  };
}

const foodArtCache = createImageCache(url => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => { image.onload = null; image.onerror = null; resolve(image); };
  image.onerror = () => { image.onload = null; image.onerror = null; reject(new Error('餐品插画载入失败')); };
  image.src = url;
}));

export const loadFoodArt = (presetId: string) => foodArtCache.get(`/food-planets/${presetId}.svg`);
