import React from "react";
import { TrendingUp, Clock, Shield } from "lucide-react";

const items = [
    { icon: TrendingUp, label: "Faster processing", value: "100x" },
    { icon: Clock, label: "Hours saved weekly", value: "40+" },
    { icon: Shield, label: "Data accuracy", value: "99.9%" },
];

const StatsSection: React.FC = () => (
    <section className="py-16 px-6 md:px-12 bg-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            {items.map((item) => (
                <div key={item.label} className="space-y-2">
                    <item.icon className="w-8 h-8 mx-auto text-cyan" />
                    <p className="text-3xl font-bold">{item.value}</p>
                    <p className="text-gray-medium text-sm">{item.label}</p>
                </div>
            ))}
        </div>
    </section>
);

export default StatsSection;