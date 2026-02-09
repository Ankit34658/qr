import { Phone, MessageSquare } from "lucide-react";

interface ContactButtonsProps {
    onCall: () => void;
    onWhatsApp: () => void;
}

export default function ContactButtons({ onCall, onWhatsApp }: ContactButtonsProps) {
    return (
        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
            <button
                onClick={onCall}
                className="flex flex-col items-center gap-3 bg-blue-50 text-blue-700 p-6 rounded-3xl hover:bg-blue-100 transition border border-blue-100"
            >
                <Phone size={24} />
                <span className="font-bold">Call Owner</span>
            </button>
            <button
                onClick={onWhatsApp}
                className="flex flex-col items-center gap-3 bg-emerald-50 text-emerald-700 p-6 rounded-3xl hover:bg-emerald-100 transition border border-emerald-100"
            >
                <MessageSquare size={24} />
                <span className="font-bold">WhatsApp</span>
            </button>
        </div>
    );
}
