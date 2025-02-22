import { useMount } from "react-use";
import { Alert, Box, Button, ButtonGroup, Flex, IconButton, Spacer, useDisclosure, useToast } from "@chakra-ui/react";

import { PayRequest } from ".";
import { UserAvatar } from "../user-avatar";
import { UserLink } from "../user-link";
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, ErrorIcon, LightningIcon } from "../icons";
import { InvoiceModalContent } from "../invoice-modal";
import { PropsWithChildren, useEffect, useState } from "react";
import appSettings from "../../services/settings/app-settings";

function UserCard({ children, pubkey }: PropsWithChildren & { pubkey: string }) {
  return (
    <Flex gap="2" alignItems="center" overflow="hidden">
      <UserAvatar pubkey={pubkey} size="md" />
      <Box>
        <UserLink pubkey={pubkey} fontWeight="bold" />
      </Box>
      <Spacer />
      {children}
    </Flex>
  );
}
function PayRequestCard({ pubkey, invoice, onPaid }: { pubkey: string; invoice: string; onPaid: () => void }) {
  const toast = useToast();
  const showMore = useDisclosure();

  const payWithWebLn = async () => {
    try {
      if (window.webln && invoice) {
        if (!window.webln.enabled) await window.webln.enable();
        await window.webln.sendPayment(invoice);
        onPaid();
      }
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <ButtonGroup size="sm">
          <Button
            variant="outline"
            colorScheme="yellow"
            size="sm"
            leftIcon={<LightningIcon />}
            isDisabled={!window.webln}
            onClick={payWithWebLn}
          >
            Pay
          </Button>
          <IconButton
            icon={showMore.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            aria-label="More Options"
            onClick={showMore.onToggle}
          />
        </ButtonGroup>
      </UserCard>
      {showMore.isOpen && <InvoiceModalContent invoice={invoice} onPaid={onPaid} />}
    </Flex>
  );
}
function ErrorCard({ pubkey, error }: { pubkey: string; error: any }) {
  const showMore = useDisclosure();

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <Button size="sm" variant="outline" colorScheme="red" leftIcon={<ErrorIcon />} onClick={showMore.onToggle}>
          Error
        </Button>
      </UserCard>
      {showMore.isOpen && <Alert status="error">{error.message}</Alert>}
    </Flex>
  );
}

export default function PayStep({ callbacks, onComplete }: { callbacks: PayRequest[]; onComplete: () => void }) {
  const [paid, setPaid] = useState<string[]>([]);

  const [payingAll, setPayingAll] = useState(false);
  const payAllWithWebLN = async () => {
    if (!window.webln) return;

    setPayingAll(true);
    if (!window.webln.enabled) await window.webln.enable();

    for (const { invoice, pubkey } of callbacks) {
      try {
        if (invoice && !paid.includes(pubkey)) {
          await window.webln.sendPayment(invoice);
          setPaid((a) => a.concat(pubkey));
        }
      } catch (e) {}
    }
    setPayingAll(false);
  };

  useEffect(() => {
    if (!callbacks.filter((p) => !!p.invoice).some(({ pubkey }) => !paid.includes(pubkey))) {
      onComplete();
    }
  }, [paid]);

  // if autoPayWithWebLN is enabled, try to pay all immediately
  useMount(() => {
    if (appSettings.value.autoPayWithWebLN) {
      payAllWithWebLN();
    }
  });

  return (
    <Flex direction="column" gap="4">
      {callbacks.map(({ pubkey, invoice, error }) => {
        if (paid.includes(pubkey))
          return (
            <UserCard key={pubkey} pubkey={pubkey}>
              <Button size="sm" variant="outline" colorScheme="green" leftIcon={<CheckIcon />}>
                Paid
              </Button>
            </UserCard>
          );
        if (error) return <ErrorCard key={pubkey} pubkey={pubkey} error={error} />;
        if (invoice)
          return (
            <PayRequestCard
              key={pubkey}
              pubkey={pubkey}
              invoice={invoice}
              onPaid={() => setPaid((a) => a.concat(pubkey))}
            />
          );
        return null;
      })}
      <Button
        variant="outline"
        size="md"
        leftIcon={<LightningIcon />}
        colorScheme="yellow"
        onClick={payAllWithWebLN}
        isLoading={payingAll}
      >
        Pay All
      </Button>
    </Flex>
  );
}
