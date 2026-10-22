import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, ExternalLink, QrCode } from 'lucide-react';
import { Modal } from '../common/Modal';
import { TournamentMatch, TournamentTeam } from '../../types/tournament';
import { formatTeamName, getTournamentTeam } from '../../utils/tournamentEngine';

interface ShareLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
  matches: TournamentMatch[];
  teams: TournamentTeam[];
}

export const ShareLiveModal: React.FC<ShareLiveModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  matches,
  teams,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const spectatorUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?tournamentId=${encodeURIComponent(tournamentId)}&view=spectator`
      : `/?tournamentId=${encodeURIComponent(tournamentId)}&view=spectator`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(spectatorUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy spectator link:', err);
    }
  };

  const generateWhatsAppSnapshot = () => {
    const liveMatches = matches.filter((m) => m.status === 'IN_PROGRESS');
    const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

    let text = `🏸 *${tournamentName.toUpperCase()} - LIVE BOARD* 🏸\n\n`;
    text += `📲 *Live Spectator Link:*\n${spectatorUrl}\n\n`;

    if (liveMatches.length > 0) {
      text += `🔥 *NOW ON COURT:*\n`;
      liveMatches.forEach((m) => {
        const tA = getTournamentTeam(m.teamAId, teams);
        const tB = getTournamentTeam(m.teamBId, teams);
        text += `• ${m.courtName || 'Court'}: ${formatTeamName(tA)} vs ${formatTeamName(tB)}\n`;
      });
      text += `\n`;
    }

    text += `📊 *Completed Matches:* ${completedMatches.length}/${matches.length}\n`;
    text += `Track instant live scores, court rotations, and pool standings via the link above!`;

    return text;
  };

  const handleShareWhatsApp = () => {
    const snapshot = generateWhatsAppSnapshot();
    const encoded = encodeURIComponent(snapshot);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopySnapshot = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppSnapshot());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Live Spectator Board">
      <div className="space-y-5 text-center max-w-sm mx-auto">
        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-xl shadow-black/40 mx-auto w-fit">
          <QRCodeSVG
            value={spectatorUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
          <div className="mt-2.5 text-slate-800 text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scan for Live Match Board</span>
          </div>
        </div>

        {/* Spectator URL Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 text-left">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Player Spectator Link
            </span>
            <p className="text-xs font-mono text-emerald-400 truncate mt-0.5">
              {spectatorUrl}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Share to WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopySnapshot}
            className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Snapshot Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Snapshot</span>
              </>
            )}
          </button>
        </div>

        {/* Open Spectator View Button */}
        <div className="pt-2 border-t border-slate-800 flex justify-center">
          <a
            href={spectatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Open Spectator Dashboard in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
