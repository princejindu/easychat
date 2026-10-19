import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { TASKS, timeAgo } from '../lib/meta';
import { copyText, InterestMeter, NextMove, RedFlags, ReplyCard, TranscriptView } from '../components/results';
import { IconButton, TopBar, useToast } from '../components/ui';

export default function HistoryDetail() {
  const { id } = useParams();
  const store = useStore();
  const toast = useToast();
  const nav = useNavigate();
  const h = store.history.find((x) => x.id === id);
  if (!h) {
    return (
      <div>
        <TopBar title="Expired" />
        <p className="p-6 text-[14px] text-muted">This item was deleted or passed its retention window.</p>
      </div>
    );
  }
  const meta = Object.values(TASKS).find((t) => t.id === h.task) ?? TASKS.paste;
  const contact = store.contacts.find((c) => c.id === h.contactId);
  return (
    <div className="pb-24">
      <TopBar
        title={meta.title}
        subtitle={`${contact ? contact.name + ' · ' : ''}${timeAgo(h.at)}`}
        right={
          <IconButton label="Delete" onClick={() => { store.removeHistory(h.id); toast('Deleted'); nav(-1); }}>
            <Trash2 size={18} />
          </IconButton>
        }
      />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 px-4">
        {h.result.transcript.length > 0 && (
          <div className="rounded-3xl border border-line bg-surface p-4">
            <TranscriptView lines={h.result.transcript} />
          </div>
        )}
        <RedFlags flags={h.result.red_flags} />
        {h.result.interest && <InterestMeter interest={h.result.interest} />}
        {h.result.options.map((o, i) => (
          <ReplyCard
            key={o.text}
            option={o}
            index={i}
            onCopy={async (t) => { await copyText(t); toast('Copied'); store.markCopied(h.id, t); }}
            onFavourite={(t) => store.toggleFavourite(t, o.label, h.contactId)}
            favourite={store.isFavourite(o.text)}
            onEdit={() => {}}
          />
        ))}
        <NextMove text={h.result.next_step} />
      </motion.div>
    </div>
  );
}
