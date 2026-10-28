import Image from 'next/image';
import styles from '../styles/about.module.css';

export type AboutMaterialImage = Readonly<{
  id: string;
  src: string | null;
  alt: string;
  caption?: string | null;
}>;

type AboutMaterialProps = {
  images: readonly AboutMaterialImage[];
};

export function AboutMaterial({ images }: AboutMaterialProps) {
  const available = images.filter((image): image is AboutMaterialImage & { src: string } => Boolean(image.src));

  // Pending designer assets remain in the manifest, never as empty figures.
  if (!available.length) return null;

  return (
    <div className={styles.material} data-about-material>
      {available.map((image) => (
        <figure className={styles.materialFigure} key={image.id} data-about-material-image={image.id}>
          <div className={styles.materialImageFrame}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 767px) 85vw, (max-width: 1023px) 45vw, 28vw"
              className={styles.materialImage}
              loading="lazy"
            />
          </div>
          {image.caption && <figcaption className={`${styles.materialCaption} font-mono font-normal`}>{image.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
