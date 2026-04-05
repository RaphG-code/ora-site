import React from "react";
import { FileSpreadsheet, Sparkles } from "lucide-react";

const ExcelAutomationDemo: React.FC = () => (
    <section className="py-20 px-6 md:px-12 bg-black">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    See Excel automation in action
                </h2>
                <p className="text-gray-medium mb-4">
                    Ora ingests messy spreadsheets, validates data, and outputs clean,
                    structured files ready for your team.
                </p>
                <ul className="space-y-2 text-gray-light text-sm">
                    <li>• Detects missing values and anomalies</li>
                    <li>• Standardizes formats across files</li>
                    <li>• Generates summary reports automatically</li>
                </ul>
            </div>
            <div className="relative">
                <div className="rounded-2xl border border-cyan/40 bg-gradient-primary/10 p-6 animate-float">
                    <div className="flex items-center gap-3 mb-4">
                        <FileSpreadsheet className="w-6 h-6 text-cyan" />
                        <span className="font-semibold">Invoices_Q1.xlsx</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Rows cleaned</span>
                            <span className="text-cyan font-mono">12,483</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Errors fixed</span>
                            <span className="text-cyan font-mono">327</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Time saved</span>
                            <span className="text-cyan font-mono">4h 32m</span>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-gray-light">
                        <Sparkles className="w-4 h-4 text-cyan" />
                        <span>Powered by Ora AI engine</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default ExcelAutomationDemo;