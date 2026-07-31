import { Brain } from "lucide-react";
import Image from "next/image";


export default function Logo() {
    return (
        <div className="flex w-max items-center">
            <div className="w-12 aspect-square flex items-center justify-center">
                <Brain className="w-10 h-10 text-white" />
            </div>
            <p className="font-orbitron text-white">
                Quizify
            </p>
        </div>
    )
}