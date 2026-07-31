import { CircleUserRound } from "lucide-react";
import Logo from "./Logo";


export default function NavBar() {
    return (
        <div className="bg-darker flex py-4 items-center justify-between px-2">
            <Logo />
            <div className="flex gap-4">
                <button className="text-white">Contact Us</button>
                <CircleUserRound className="text-white" />
            </div>
        </div>
    )
}