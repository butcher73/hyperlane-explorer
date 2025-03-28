import { MAILBOX_VERSION } from '@hyperlane-xyz/sdk';
import { formatMessage } from '@hyperlane-xyz/utils';
import { SelectField, Tooltip } from '@hyperlane-xyz/widgets';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/layout/Card';
import EnvelopeInfo from '../../../images/icons/envelope-info.svg';
import { useMultiProvider } from '../../../store';
import { Message } from '../../../types';
import { logger } from '../../../utils/logger';
import { tryUtf8DecodeBytes } from '../../../utils/string';
import { tryGetBlockExplorerAddressUrl } from '../../../utils/url';
import { CodeBlock, LabelAndCodeBlock } from './CodeBlock';
import { KeyValueRow } from './KeyValueRow';
import { BlockExplorerAddressUrls } from './types';

interface Props {
  message: Message;
  blur: boolean;
}

export function ContentDetailsCard({
  message: {
    msgId,
    nonce,
    originDomainId,
    destinationDomainId,
    sender,
    recipient,
    body,
    decodedBody,
    originChainId,
    destinationChainId,
  },
  blur,
}: Props) {
  const multiProvider = useMultiProvider();
  const [bodyDecodeType, setBodyDecodeType] = useState<string>(decodedBody ? 'utf8' : 'hex');
  const [blockExplorerAddressUrls, setBlockExplorerAddressUrls] = useState<
    BlockExplorerAddressUrls | undefined
  >(undefined);

  useEffect(() => {
    if (decodedBody) setBodyDecodeType('utf8');
  }, [decodedBody]);
  const onChangeBodyDecode = (value: string) => {
    setBodyDecodeType(value);
  };

  const bodyDisplay = useMemo(() => {
    return (
      (bodyDecodeType === 'hex'
        ? body
        : decodedBody || tryUtf8DecodeBytes(body, false) || 'Unable to decode') || ''
    );
  }, [bodyDecodeType, decodedBody, body]);

  const rawBytes = useMemo(() => {
    try {
      if (!originDomainId || !destinationDomainId) return '';
      return formatMessage(
        MAILBOX_VERSION,
        nonce,
        originDomainId,
        sender,
        destinationDomainId,
        recipient,
        body,
      );
    } catch (error) {
      logger.warn('Error formatting message', error);
      return '';
    }
  }, [nonce, originDomainId, sender, destinationDomainId, recipient, body]);

  const getBlockExplorerLinks = useCallback(async (): Promise<
    BlockExplorerAddressUrls | undefined
  > => {
    const senderAddressLink = await tryGetBlockExplorerAddressUrl(
      multiProvider,
      originChainId,
      sender,
    );
    const recipientAddressLink = await tryGetBlockExplorerAddressUrl(
      multiProvider,
      destinationChainId,
      recipient,
    );
    return { sender: senderAddressLink, recipient: recipientAddressLink };
  }, [destinationChainId, originChainId, multiProvider, sender, recipient]);

  useEffect(() => {
    getBlockExplorerLinks()
      .then((urls) => setBlockExplorerAddressUrls(urls))
      .catch(() => setBlockExplorerAddressUrls(undefined));
  }, [getBlockExplorerLinks]);

  return (
    <Card className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Image src={EnvelopeInfo} width={28} height={28} alt="" className="opacity-80" />
        <div className="flex items-center pb-1">
          <h3 className="mr-2 text-md font-medium text-blue-500">Message Details</h3>
          <Tooltip
            id="message-info"
            content="Immutable information about the message itself such as its contents."
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <KeyValueRow
          label="Identifier:"
          labelWidth="w-16"
          display={msgId}
          displayWidth="w-64 sm:w-72"
          showCopy={true}
          blurValue={blur}
          copyButtonClasses={blockExplorerAddressUrls?.sender && 'sm:ml-6'}
        />
        <KeyValueRow label="Nonce:" labelWidth="w-16" display={nonce.toString()} blurValue={blur} />
        <KeyValueRow
          label="Sender:"
          labelWidth="w-16"
          display={sender}
          displayWidth="w-64 sm:w-72"
          showCopy={true}
          blurValue={blur}
          link={blockExplorerAddressUrls?.sender}
        />
        <KeyValueRow
          label="Recipient:"
          labelWidth="w-16"
          display={recipient}
          displayWidth="w-64 sm:w-72"
          showCopy={true}
          blurValue={blur}
          link={blockExplorerAddressUrls?.recipient}
        />
      </div>
      <div>
        <div className="flex items-center">
          <label className="text-sm text-gray-500">Message Content:</label>
          <SelectField
            classes="w-16 h-7 py-0.5 ml-3 mb-0.5"
            options={decodeOptions}
            value={bodyDecodeType}
            onValueSelect={onChangeBodyDecode}
          />
        </div>
        <CodeBlock value={bodyDisplay} />
      </div>
      <LabelAndCodeBlock label="Raw bytes:" value={rawBytes} />
    </Card>
  );
}

const decodeOptions = [
  { value: 'hex', display: 'Hex' },
  { value: 'utf8', display: 'Utf-8' },
];
