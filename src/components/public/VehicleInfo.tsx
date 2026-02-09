import { Car } from "lucide-react";

interface VehicleInfoProps {
    plate: string;
    makeModel: string;
    color: string;
    ownerName: string;
}

export default function VehicleInfo({ plate, makeModel, color, ownerName }: VehicleInfoProps) {
    return (
        <div className="bg-white rounded-[32px] shadow-xl shadow-blue-100/50 p-8 border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Car size={24} />
                </div>
            </div>

            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6 px-3 py-1 bg-blue-50 rounded-lg inline-block">
                Vehicle Info
            </h2>

            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Plate Number</p>
                    <p className="text-xl font-black text-gray-900">{plate}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Make & Model</p>
                        <p className="font-bold text-gray-800">{makeModel}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Color</p>
                        <p className="font-bold text-gray-800">{color}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                        {ownerName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Owner</p>
                        <p className="text-sm font-bold text-gray-700">{ownerName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
