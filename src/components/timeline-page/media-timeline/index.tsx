import { useMemo, useRef } from "react";
import { Kind } from "nostr-tools";
import { Photo } from "react-photo-album";

import TimelineLoader from "../../../classes/timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { getMatchLink } from "../../../helpers/regexp";
import { LightboxProvider } from "../../lightbox-provider";
import { isImageURL } from "../../../helpers/url";
import { EmbeddedImage, EmbeddedImageProps, GalleryImage } from "../../embed-types";
import { TrustProvider } from "../../../providers/trust";
import PhotoGallery, { PhotoWithoutSize } from "../../photo-gallery";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { NostrEvent } from "../../../types/nostr-event";
import { getEventUID } from "../../../helpers/nostr/events";
import { useBreakpointValue } from "../../../providers/breakpoint-provider";

function CustomGalleryImage({ event, ...props }: EmbeddedImageProps & { event: NostrEvent }) {
  const ref = useRef<HTMLImageElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return <GalleryImage {...props} event={event} ref={ref} />;
}

type PhotoWithEvent = PhotoWithoutSize & { event: NostrEvent };
function ImageGallery({ images }: { images: PhotoWithEvent[] }) {
  const rowMultiplier = useBreakpointValue({ base: 2, sm: 3, md: 3, lg: 4, xl: 5 }) ?? 2;

  return (
    <PhotoGallery<Photo & { event: NostrEvent }>
      layout="masonry"
      photos={images}
      renderPhoto={({ photo, imageProps }) => (
        <CustomGalleryImage src={imageProps.src} event={photo.event} style={imageProps.style} />
      )}
      columns={rowMultiplier}
    />
  );
}

export default function MediaTimeline({ timeline }: { timeline: TimelineLoader }) {
  const events = useSubject(timeline.timeline);

  const images = useMemo(() => {
    var images: PhotoWithEvent[] = [];

    for (const event of events) {
      if (event.kind === Kind.Repost) continue;
      const urls = event.content.matchAll(getMatchLink());

      let i = 0;
      for (const match of urls) {
        if (isImageURL(match[0])) images.push({ event, src: match[0] });
      }
    }

    return images;
  }, [events]);

  return (
    <LightboxProvider>
      <TrustProvider trust>
        <ImageGallery images={images} />
      </TrustProvider>
    </LightboxProvider>
  );
}
