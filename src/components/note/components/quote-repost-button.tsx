import { useContext } from "react";
import { ButtonProps, IconButton } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { QuoteRepostIcon } from "../../icons";
import { PostModalContext } from "../../../providers/post-modal-provider";
import { getSharableEventAddress } from "../../../helpers/nip19";

export type QuoteRepostButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  event: NostrEvent;
};

export function QuoteRepostButton({
  event,
  "aria-label": ariaLabel,
  title = "Quote repost",
  ...props
}: QuoteRepostButtonProps) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    const nevent = getSharableEventAddress(event);
    openModal("\nnostr:" + nevent);
  };

  return (
    <IconButton
      icon={<QuoteRepostIcon />}
      onClick={handleClick}
      aria-label={ariaLabel || title}
      title={title}
      {...props}
    />
  );
}
