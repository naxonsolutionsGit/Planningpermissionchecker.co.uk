"use client"

import { Header } from "@/components/header"
import { Shield, Scale, AlertTriangle, CheckCircle } from "lucide-react"

export default function LegalNoticePage() {
    const legalNoticeSections = [
        {
            title: "Overview",
            icon: <Shield className="w-6 h-6 text-[#253325]" />,
            content: [
                "PDRightCheck is a paid information and screening service that collates, analyses, and presents planning-related information to support early-stage feasibility and decision-making.",
                "The service provides a professional desktop assessment of permitted development potential, including checks against Article 4 Directions, planning constraints, and other relevant planning records, using publicly available datasets, mapping systems, and local authority information accessible at the time of the search."
            ]
        },
        {
            title: "User Responsibilities",
            icon: <CheckCircle className="w-6 h-6 text-[#253325]" />,
            content: [
                "The assessment is based in part on information submitted by the user, including (but not limited to) the property address, classification of the property (for example, house or flat), and other property-specific details. PDRightCheck relies on the accuracy and completeness of this information when generating its report.",
                "Where incorrect, incomplete, or inaccurate information is provided, the results may not be applicable to the property in question. Users remain fully responsible for ensuring the accuracy of the information submitted."
            ]
        },
        {
            title: "Limitations of Information",
            icon: <Scale className="w-6 h-6 text-[#253325]" />,
            content: [
                "While PDRightCheck takes reasonable care and professional diligence in sourcing and interpreting planning information, it does not create, verify, amend, or certify official planning records, nor does it replace the statutory role of the Local Planning Authority.",
                "Local authority records may be incomplete, amended, subject to interpretation, inconsistently digitised, or updated after the date of assessment. Certain restrictions may not be apparent from publicly accessible sources alone, including Article 4 Directions, historic planning conditions, or the removal of permitted development rights at the time of original construction.",
                "The information provided does NOT constitute legal advice, planning advice, or planning permission."
            ]
        },
        {
            title: "Liability & Disclaimer",
            icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
            content: [
                "PDRightCheck does not guarantee that permitted development rights exist or will be accepted by the Local Planning Authority. No reliance should be placed on the report as a substitute for statutory configuration.",
                "To the fullest extent permitted by law, PDRightCheck accepts no liability for loss, delay, cost, or consequence arising from reliance on the information provided, whether arising from errors or omissions in user-supplied information, changes to planning policy, or undisclosed site-specific restrictions.",
                "Use of this service constitutes acceptance of these limitations. This service is intended to support informed decision-making, not to replace statutory planning processes."
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F7F3]">
            <Header />

            {/* Hero Section */}
            <section className="bg-[#253325] py-16 text-white text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-normal mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>Legal Notice & Disclaimer</h1>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">
                        Important information regarding our planning assessment services, data limitations, and terms of use.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {legalNoticeSections.map((section, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-8 shadow-sm border border-[#EEECE6]">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-[#F8F7F3] rounded-lg">
                                    {section.icon}
                                </div>
                                <h2 className="text-2xl font-normal text-[#253325]" style={{ fontFamily: 'var(--font-playfair), serif' }}>{section.title}</h2>
                            </div>
                            <div className="space-y-4">
                                {section.content.map((para, pIdx) => (
                                    <p key={pIdx} className="text-[#4C5A63] leading-relaxed">
                                        {para}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Detailed Points */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E6E8E6]">
                        <h3 className="text-xl font-normal text-[#253325] mb-6" style={{ fontFamily: 'var(--font-playfair), serif' }}>Users remain responsible for:</h3>
                        <ul className="space-y-3">
                            {[
                                "Verifying planning status with the relevant Local Planning Authority",
                                "Obtaining written pre-application advice where appropriate",
                                "Securing a Lawful Development Certificate prior to commencing any development",
                                "Compliance with building regulations and neighbor consultations"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-[#4C5A63]">
                                    <CheckCircle className="w-5 h-5 text-[#253325] mt-1 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-[#2D3748] text-white py-12 border-t border-white/10">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-white/70">
                        PDRightCheck • Ensuring Clarity in Planning & Permitted Development
                    </p>
                    <p className="text-white/50 text-sm mt-4">
                        © {new Date().getFullYear()} PDRightCheck.co.uk. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
