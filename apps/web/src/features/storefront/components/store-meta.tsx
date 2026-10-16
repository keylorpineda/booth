import { useStoreContext } from '../store-context';

/** Per-store title, description and Open Graph tags (React 19 hoists them into <head>). */
export function StoreMeta() {
  const { store } = useStoreContext();
  const description = store.description ?? store.name;
  const image = store.coverUrl ?? store.logoUrl;

  return (
    <>
      <title>{`${store.name} · Booth`}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content={store.brandColor} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={store.name} />
      <meta property="og:description" content={description} />
      {image ? <meta property="og:image" content={image} /> : null}
    </>
  );
}
