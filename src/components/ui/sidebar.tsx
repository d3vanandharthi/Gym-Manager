import React, { useState, createContext, useContext } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SidebarLinkConfig {
    label: string;
    href: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

interface SidebarContextProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    animate: boolean;
    pinned: boolean;
    setPinned: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
    return ctx;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
    pinned: pinnedProp,
    setPinned: setPinnedProp,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
    pinned?: boolean;
    setPinned?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const [openState, setOpenState] = useState(false);
    const [pinnedState, setPinnedState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
    const pinned = pinnedProp !== undefined ? pinnedProp : pinnedState;
    const setPinned = setPinnedProp !== undefined ? setPinnedProp : setPinnedState;
    return (
        <SidebarContext.Provider value={{ open, setOpen, animate, pinned, setPinned }}>
            {children}
        </SidebarContext.Provider>
    );
};

// ─── Root Sidebar Wrapper ───────────────────────────────────────────────────

export const Sidebar = ({
    children,
    open,
    setOpen,
    animate = true,
    pinned,
    setPinned,
}: {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    animate?: boolean;
    pinned?: boolean;
    setPinned?: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate} pinned={pinned} setPinned={setPinned}>
        {children}
    </SidebarProvider>
);

// ─── SidebarBody — renders Desktop + Mobile ─────────────────────────────────

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => (
    <>
        <DesktopSidebar {...props} />
        <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
);

// ─── Desktop Sidebar (hover to expand, or pinned open) ──────────────────────

export const DesktopSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof motion.div>) => {
    const { open, setOpen, animate, pinned } = useSidebar();
    const isOpen = pinned || open;
    return (
        <motion.div
            className={cn(
                "hidden md:flex md:flex-col flex-shrink-0 h-full overflow-hidden",
                className
            )}
            style={{ backgroundColor: "var(--bg-sidebar)" }}
            animate={{ width: animate ? (isOpen ? 280 : 68) : 280 }}
            transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.8 }}
            onMouseEnter={() => !pinned && setOpen(true)}
            onMouseLeave={() => !pinned && setOpen(false)}
            {...props}
        >
            <div className="flex flex-col h-full px-3 py-4 overflow-hidden">
                {children}
            </div>
        </motion.div>
    );
};

// ─── Mobile Sidebar (slide-in overlay) ─────────────────────────────────────

export const MobileSidebar = ({
    className,
    children,
    ...props
}: React.ComponentProps<"div">) => {
    const { open, setOpen } = useSidebar();
    return (
        <>
            {/* Mobile top bar */}
            <div
                className="h-14 px-4 flex flex-row md:hidden items-center justify-between w-full flex-shrink-0"
                style={{ backgroundColor: "var(--bg-sidebar)" }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="p-1.5 rounded-lg"
                        style={{ background: "linear-gradient(135deg, #0d9488, #059669)" }}
                    >
                        {/* dumbbell icon inline */}
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M8 7v10M16 7v10M20 9.5v5" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-sm">Gym Manager</span>
                </div>
                <button
                    className="text-white/50 hover:text-white transition-colors"
                    onClick={() => setOpen(!open)}
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Slide-in overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className={cn(
                            "fixed inset-0 z-[100] flex flex-col p-6 md:hidden",
                            className
                        )}
                        style={{ backgroundColor: "var(--bg-sidebar)" }}
                    >
                        <button
                            className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// ─── SidebarLink ─────────────────────────────────────────────────────────────

export const SidebarLink = ({
    link,
    className,
}: {
    link: SidebarLinkConfig;
    className?: string;
}) => {
    const { open, animate, pinned } = useSidebar();
    const isExpanded = pinned || open;

    const inner = (isActive: boolean) => (
        <>
            {/* Icon — always visible */}
            <span
                className={cn(
                    "flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-150",
                    isActive ? "text-teal-300" : "text-white/40 group-hover:text-white/75"
                )}
            >
                {link.icon}
            </span>

            {/* Label — animated in/out */}
            <motion.span
                animate={{
                    display: animate ? (isExpanded ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (isExpanded ? 1 : 0) : 1,
                    x: animate ? (isExpanded ? 0 : -4) : 0,
                }}
                transition={{ duration: 0.15 }}
                className={cn(
                    "text-sm font-medium whitespace-nowrap overflow-hidden",
                    isActive ? "text-teal-300" : "text-white/50 group-hover:text-white/80"
                )}
            >
                {link.label}
            </motion.span>

            {/* Active dot */}
            {isActive && isExpanded && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"
                />
            )}
        </>
    );

    const itemClass = (isActive: boolean) =>
        cn(
            "group flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-150 w-full",
            isActive
                ? "bg-teal-500/[0.12]"
                : "hover:bg-white/[0.05]",
            className
        );

    // Button variant (logout, dark mode, etc.)
    if (link.onClick) {
        return (
            <button
                onClick={link.onClick}
                className={itemClass(false)}
                title={!isExpanded ? link.label : undefined}
            >
                {inner(false)}
            </button>
        );
    }

    // NavLink variant
    return (
        <NavLink
            to={link.href}
            className={({ isActive }) => itemClass(isActive)}
            title={!isExpanded ? link.label : undefined}
        >
            {({ isActive }) => inner(isActive)}
        </NavLink>
    );
};
