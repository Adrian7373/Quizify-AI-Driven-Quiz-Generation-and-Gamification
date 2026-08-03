import { CirclePoundSterling, CircleUserRound } from "lucide-react";
import Logo from "./Logo";
import { AppUser } from "../page";

interface NavBarProps {
    user: AppUser | null
}

export default function NavBar({ user }: NavBarProps) {
    return (
        <div className="fixed w-full bg-darker flex py-4 items-center justify-between px-2">
            <Logo />
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-white">
                    <p>{user?.name}</p>
                    <CircleUserRound className="text-white" />
                </div>
                <div className="flex items-center gap-2 text-white justify-end">
                    <p>{user?.aiCredits}</p>
                    <CirclePoundSterling />
                </div>
            </div>
        </div>
    )
}