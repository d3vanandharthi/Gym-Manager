import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface NavItemConfig {
    id: number;
    label: string;
    subMenus?: {
        title: string;
        items: {
            label: string;
            description: string;
            icon: React.ElementType;
        }[];
    }[];
    link?: string;
    onClick?: () => void;
}

interface DropdownNavigationProps {
    navItems: NavItemConfig[];
}

export function DropdownNavigation({ navItems }: DropdownNavigationProps) {
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);
    const [isHover, setIsHover] = useState<number | null>(null);

    const handleHover = (menuLabel: string | null) => {
        setOpenMenu(menuLabel);
    };

    return (
        <div className="relative gap-5 flex flex-col items-center justify-center">
            <ul className="relative flex items-center space-x-0">
                {navItems.map((navItem) => (
                    <li
                        key={navItem.label}
                        className="relative"
                        onMouseEnter={() => handleHover(navItem.label)}
                        onMouseLeave={() => handleHover(null)}
                    >
                        <button
                            className="text-sm py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 relative"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={() => setIsHover(navItem.id)}
                            onMouseLeave={() => setIsHover(null)}
                            onClick={navItem.onClick}
                        >
                            <span style={{ color: openMenu === navItem.label ? 'var(--text-primary)' : undefined }}>
                                {navItem.label}
                            </span>
                            {navItem.subMenus && (
                                <ChevronDown
                                    className={`h-4 w-4 duration-300 transition-transform ${
                                        openMenu === navItem.label ? "rotate-180" : ""
                                    }`}
                                />
                            )}
                            {(isHover === navItem.id || openMenu === navItem.label) && (
                                <motion.div
                                    layoutId="hover-bg"
                                    className="absolute inset-0 size-full"
                                    style={{
                                        borderRadius: 99,
                                        backgroundColor: 'var(--accent-light)',
                                    }}
                                />
                            )}
                        </button>

                        <AnimatePresence>
                            {openMenu === navItem.label && navItem.subMenus && (
                                <div className="w-auto absolute left-0 top-full pt-2 z-50">
                                    <motion.div
                                        className="border p-4 w-max"
                                        style={{
                                            borderRadius: 16,
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderColor: 'var(--border-color)',
                                            boxShadow: 'var(--shadow-lg)',
                                        }}
                                        layoutId="menu"
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                    >
                                        <div className="w-fit shrink-0 flex space-x-9 overflow-hidden">
                                            {navItem.subMenus.map((sub) => (
                                                <motion.div layout className="w-full" key={sub.title}>
                                                    <h3
                                                        className="mb-4 text-sm font-medium capitalize"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        {sub.title}
                                                    </h3>
                                                    <ul className="space-y-4">
                                                        {sub.items.map((item) => {
                                                            const Icon = item.icon;
                                                            return (
                                                                <li key={item.label}>
                                                                    <a
                                                                        href="#"
                                                                        className="flex items-start space-x-3 group"
                                                                    >
                                                                        <div
                                                                            className="border rounded-md flex items-center justify-center size-9 shrink-0 group-hover:bg-[var(--accent-light)] transition-colors duration-300"
                                                                            style={{
                                                                                borderColor: 'var(--border-color)',
                                                                                color: 'var(--text-primary)',
                                                                            }}
                                                                        >
                                                                            <Icon className="h-5 w-5 flex-none" />
                                                                        </div>
                                                                        <div className="leading-5 w-max">
                                                                            <p
                                                                                className="text-sm font-medium shrink-0"
                                                                                style={{ color: 'var(--text-primary)' }}
                                                                            >
                                                                                {item.label}
                                                                            </p>
                                                                            <p
                                                                                className="text-xs shrink-0 group-hover:text-[var(--text-primary)] transition-colors duration-300"
                                                                                style={{ color: 'var(--text-muted)' }}
                                                                            >
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
                                                                    </a>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export type { NavItemConfig, DropdownNavigationProps };
