'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, ChevronDown, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Section {
  id: string
  title: string
  subsections: Array<{
    id: string
    title: string
    content: string | string[]
  }>
}

const sections: Section[] = [
  {
    id: '1',
    title: '1. Definitions',
    subsections: [
      {
        id: '1-1',
        title: 'Key Terms',
        content: [
          'Affiliates — means (a) an entity of which a party directly or indirectly owns more than fifty percent (50%) of the stock or other equity interest, (b) an entity that owns more than fifty percent (50%) of the stock or other equity interest of a party or (c) an entity which is under common control with a party by having more than fifty percent (50%) of the stock or other equity interest of such entity and a party owned by the same person, but such entity shall only be deemed to be an Affiliate so long as such ownership exists.',
          'Customer Data — means all data, information, and other materials submitted by Customer to the Services.',
          'Documentation — means any user guide, help information and other documentation and information regarding the Services that is delivered by Company to Customer in electronic or other form, available at https://www.kernel.sh/docs, including any updates provided by Company from time to time.',
          'Kernel Website — means the website located at https://www.kernel.sh/.',
          'Services — means the products and services made available by Company to Customer as may be mutually agreed to by the parties in an Order Form.',
        ],
      },
    ],
  },
  {
    id: '2',
    title: '2. Company Services',
    subsections: [
      {
        id: '2-1',
        title: '2.1 Order Forms',
        content: 'This Agreement will be implemented through one or more written Order Forms. Any change to the terms of this Agreement within an Order Form will apply only to the Services described therein. Company may provide the Services directly, or indirectly using contractors or other third party vendors or service providers. Customer may enter into Order Forms on behalf of its Affiliates, provided that Customer shall remain responsible for all obligations under such Order Forms.',
      },
      {
        id: '2-2',
        title: '2.2 Services',
        content: 'Subject to all terms and conditions of this Agreement, Company will provide the Services described in an applicable Order Form. Company grants Customer a limited, non-exclusive, non-transferable, non-sublicensable right and license to use and access the Services solely for Customer\'s internal business purposes in accordance with the Documentation for the applicable term of the Order Form.',
      },
      {
        id: '2-3',
        title: '2.3 Access and Account Setup',
        content: 'Company will provide Customer with access privileges that permit Customer to access and manage its account ("Customer Account") and access, analyze and download Customer Data. Customer will identify an administrative user name and password that will be used to set up Customer\'s account. Customer must provide accurate and complete information and keep the Customer Account information updated. The number of Customer employees that may access the Customer Account is listed in the applicable Order Form. Customer is solely responsible for the activity that occurs on the Customer Account, and for keeping the Customer Account password secure. Customer may never use another person\'s user account or registration information for Company\'s Services without permission. Customer must notify Company immediately of any discovered or otherwise suspected breach of security or unauthorized use of the Customer Account. Customer shall be responsible for the acts or omissions of any person who accesses the Services using passwords or access procedures provided to or created by Customer.',
      },
      {
        id: '2-4',
        title: '2.4 Modifications',
        content: 'From time to time, Company may provide upgrades, patches, enhancements, or fixes for the Services to its customers generally without additional charge ("Updates"), and such Updates will become part of the Services and subject to this Agreement; provided that Company shall have no obligation under this Agreement or otherwise to provide any such Updates. Customer understands that Company may make improvements and modifications to the Services at any time in its sole discretion; provided that Company shall use commercially reasonable efforts to give Customer reasonable prior notice of any major changes.',
      },
      {
        id: '2-5',
        title: '2.5 Feedback',
        content: 'Customer may (but is not obligated to) provide suggestions, comments or other feedback to Company with respect to the Service ("Feedback"). Company acknowledges and agrees that all Feedback is provided "AS IS" and without warranty of any kind. Notwithstanding anything else, Customer shall, and hereby does, grant to Company a nonexclusive, worldwide, perpetual, irrevocable, transferable, sublicensable, royalty-free, fully paid up license to use and exploit the Feedback for any purpose.',
      },
      {
        id: '2-6',
        title: '2.6 Cooperation',
        content: 'Customer acknowledges that the Services may require the reasonable cooperation of Customer personnel, as may be requested by Company from time to time. Without limiting the foregoing, where agreement, approval, acceptance, consent or similar action by Customer is required by any provision of this Agreement, such action shall not be unreasonably delayed or withheld, and Customer acknowledges that any delay or failure on the part of Customer to provide the same will relieve Company of its obligations under any Order Form for the pendency of such delay or failure.',
      },
      {
        id: '2-7',
        title: '2.7 Third-Party Integrations',
        content: 'The Services may contain features designed to interoperate with services or applications operated or provided by third parties ("Third-Party Integrations"). To use such features, Customer may be required to obtain access to such Third-Party Integrations from their providers. Any exchange of Customer Data or other data between Customer and any third-party provider is solely between Customer and such third-party provider and is subject to such third party\'s terms. Company does not warrant or support Third-Party Integrations or services (whether or not they are designated by Company as being certified or otherwise). Company is not responsible for third-party integrations or their terms of use.',
      },
    ],
  },
  {
    id: '3',
    title: '3. Proprietary Rights',
    subsections: [
      {
        id: '3-1',
        title: '3.1 Customer Data',
        content: 'Customer hereby grants to Company a worldwide, non-exclusive, royalty-free license to use, copy, access, process, reproduce, perform, display, modify, distribute and transmit the Customer Data for the purpose of providing the Services to Customer. Except for the limited rights and licenses expressly granted to Company under this Agreement, no other license is granted, no other use is permitted and Customer shall retain all rights, title and interests (including all intellectual property and proprietary rights) in and to the Customer Data. Customer, not Company, shall have sole responsibility for the accuracy, quality, integrity, legality, reliability, appropriateness, and intellectual property ownership or right to use of all Customer Data and Customer acknowledges and agrees that Company shall have no liability with respect to the foregoing.',
      },
      {
        id: '3-2',
        title: '3.2 Aggregate Data',
        content: 'Customer agrees that Company is free to disclose aggregate measures of usage and performance, and to reuse all general knowledge, experience, know-how, works and technologies (including ideas, concepts, processes and techniques) acquired during provision of the Services hereunder ("General Knowledge"), including that it could have acquired performing the same or similar services for another customer. Customer further agrees that Company shall have a perpetual, worldwide, non-exclusive, irrevocable right and license to use, store, copy, create derivatives, archive Customer Data (a) to create anonymized compilations and analyses of Customer Data that is combined with data from numerous other customers ("Aggregate Data"), (b) to create reports, evaluations, benchmarking tests, studies, analyses and other work product from Aggregate Data ("Analyses") and (c) to create, develop, enhance algorithms, machine learning and other generally available tools in connection with the Services using anonymous Customer Data. Company shall have exclusive ownership rights to, and the exclusive right to use, such Aggregate Data and Analyses for any purpose, including, but not limited to product improvement and marketing to other customers of the Services; provided, however, that Company shall not distribute Aggregate Data and Analyses in a manner that is identifiable as Customer Data.',
      },
      {
        id: '3-3',
        title: '3.3 Limited License',
        content: 'Except for the limited rights and licenses expressly granted to Customer hereunder, no other license is granted, no other use is permitted and Company (and its licensors) shall retain all rights, title and interests (including all intellectual property and proprietary rights) in and to the Services, including all ideas, concepts, inventions, systems, platforms, software, interfaces, tools, utilities, templates, forms, techniques, methods, processes, algorithms, know-how, trade secrets and other technologies, implementations and information that are used by Company in providing the Services, and all Company trademarks, names, logos, all rights to patent, copyright, trade secret and other proprietary or intellectual property rights.',
      },
      {
        id: '3-4',
        title: '3.4 Restrictions',
        content: 'Except as expressly permitted in this Agreement, Customer shall not directly or indirectly (a) use any of Company\'s Confidential Information to create any service, software, documentation or data that is similar to or competes with any aspect of the Services, (b) disassemble, decompile, reverse engineer or use any other means to attempt to discover any source code of the Services, or the underlying ideas, algorithms or trade secrets therein, (c) use the Documentation for any reason other than in connection with the Services, (d) encumber, sublicense, transfer, rent, lease, time-share or use the Services in any service bureau arrangement or otherwise for the benefit of any third party, (e) copy, distribute, manufacture, adapt, create derivative works of, translate, localize, port or otherwise modify any aspect of the Services, (f) use or allow the transmission, transfer, export, re-export or other transfer of any product, technology or information it obtains or learns pursuant to this Agreement (or any direct product thereof) in violation of any export control or other laws and regulations of the United States or any other relevant jurisdiction or (g) permit any third party to engage in any of the foregoing proscribed acts.',
      },
      {
        id: '3-5',
        title: '3.5 Data Processing Addendum',
        content: 'To the extent that, in connection with the Platform or Services, Customer provides any Customer Data that contains "Personal Data" from a European "Data Subject" that is subject to the European Union\'s General Data Protection Regulation, Provider\'s data processing addendum ("DPA") available at https://www.kernel.sh/docs/dpa will apply. Any terms not defined in this Section 3.5 will have the meanings given to them in the DPA.',
      },
    ],
  },
  {
    id: '4',
    title: '4. Confidentiality',
    subsections: [
      {
        id: '4-1',
        title: '4.1 Confidentiality Obligations',
        content: 'During the term of this Agreement, from time to time, either party may disclose ("Disclosing Party") or make available to the other party ("Receiving Party"), whether orally, electronically or in physical form, confidential or proprietary information concerning the Disclosing Party and/or its business, products or services in connection with this Agreement (together, "Confidential Information"). Confidential Information of each party includes, without limitation, business plans, customer relationships, acquisition plans, systems architecture, information systems, computer programs and codes, processes, methods, operational procedures, finances, budgets, policies and procedures, product plans, projections, analyses, plans or results, the existence of any business dealings or agreements between Customer and Company, and any other information which is normally and reasonably considered confidential. Each party agrees that during the term of this Agreement and thereafter: (a) it will use Confidential Information belonging to the Disclosing Party solely for the purposes of this Agreement; and (b) it will not disclose Confidential Information belonging to the Disclosing Party to any third party (other than the Receiving Party\'s employees, contractors and/or professional advisors on a need-to-know basis who are bound by obligations of nondisclosure and limited use at least as stringent as those contained herein) without first obtaining the Disclosing Party\'s written consent. Upon request by the Disclosing Party, the Receiving Party will return or destroy all copies of any Confidential Information to the Disclosing Party.',
      },
      {
        id: '4-2',
        title: '4.2 Exclusions',
        content: 'For purposes hereof, Confidential Information will not include any information that: (a) was previously known without restriction by the Receiving Party; (b) was independently developed by the Receiving Party without use of or reference to any Confidential Information belonging to the Disclosing Party; (c) was acquired by the Receiving Party from a third party having the legal right to furnish same to the Receiving Party without disclosure restrictions; or (d) was at the time in question (whether at disclosure or thereafter) generally known by or available to the public (through no fault of the Receiving Party).',
      },
      {
        id: '4-3',
        title: '4.3 Required Disclosures',
        content: 'Nothing herein shall prevent a Receiving Party from disclosing any Confidential Information as necessary pursuant to any court order, lawful requirement of a governmental agency or when disclosure is required by operation of law (including disclosures pursuant to any applicable securities laws and regulations); provided that prior to any such disclosure, the Receiving Party shall use reasonable efforts to (a) promptly notify the Disclosing Party in writing of such requirement to disclose (to the extent legally permissible) and (b) cooperate with the Disclosing Party in protecting against or minimizing any such disclosure or obtaining a protective order. Furthermore, either party may disclose the terms and existence of this Agreement in connection with merger, acquisition, change of control, or sale of all or substantially all of such party\'s assets or stock.',
      },
    ],
  },
  {
    id: '5',
    title: '5. Payments',
    subsections: [
      {
        id: '5-1',
        title: '5.1 Fees',
        content: 'Customer agrees to pay Company all fees and expenses in the amounts and at the times specified in the applicable Order Form (the "Fees"). For clarity, if Customer orders Services from a reseller, the Fees shall be set forth in the agreement between Customer and such reseller. All other rights and obligations of the parties regarding the any Services ordered from any reseller are as set forth in this Agreement. In the event of a conflict between the terms of this Agreement and the terms of the agreement between Customer and a reseller, the terms of this Agreement shall control to the extent of such conflict.',
      },
      {
        id: '5-2',
        title: '5.2 Taxes',
        content: 'Fees do not include any taxes, levies, duties or similar governmental assessments of any nature, including but not limited to value-added, sales, use or withholding taxes, assessable by any local, state, provincial, federal or foreign jurisdiction (collectively, "Taxes"). Customer is responsible for paying all Taxes associated with the Services under this Agreement and all Order Forms, excluding Taxes based solely on Company\'s net income. If Company is deemed to have the legal obligation to pay or collect Taxes for which Customer is responsible under this paragraph, the appropriate amount shall be invoiced to and paid by Customer, unless Customer provides Company with a valid tax exemption certificate authorized by the appropriate taxing authority.',
      },
      {
        id: '5-3',
        title: '5.3 Payment Terms',
        content: 'Unless specified otherwise or subject to a good faith dispute, and except as may be otherwise set forth in an Order Form, all amounts due hereunder shall be paid in full (without deduction, set-off or counterclaim) within thirty (30) days after Customer\'s receipt of invoice in US dollars at Company\'s address or to an account specified by Company.',
      },
      {
        id: '5-4',
        title: '5.4 Expenses',
        content: 'Where indicated on an applicable Order Form, Customer agrees to pay all of Company\'s out of pocket costs and expenses incurred by Company in the performance of its obligations under this Agreement including, without limitation, amounts incurred for air fare, travel, automobile rental, accommodations and an employee per diem.',
      },
    ],
  },
  {
    id: '6',
    title: '6. Warranties and Disclaimers',
    subsections: [
      {
        id: '6-1',
        title: '6.1 General',
        content: 'Each party represents and warrants that: (a) it is duly organized and validly existing under the laws of the jurisdiction in which it is organized; (b) it has full power and authority, and has obtained all approvals, permissions and consents necessary, to enter into this Agreement, to perform its obligations and to grant the rights hereunder; (c) this Agreement is legally binding upon it and enforceable in accordance with its terms; and (d) the execution, delivery and performance of this Agreement does not and will not conflict with any agreement, instrument, judgment or understanding, oral or written, to which it is a party or by which it may be bound.',
      },
      {
        id: '6-2',
        title: '6.2 Customer',
        content: 'Customer represents and warrants to Company that Customer owns all rights, title and interest in and to the Customer Data, or that Customer has otherwise secured all necessary rights in the Customer Data as may be necessary to permit the access, use and distribution thereof as contemplated by this Agreement.',
      },
      {
        id: '6-3',
        title: '6.3 Company',
        content: 'Company represents and warrants that it will perform the Services in compliance with all applicable laws, rules and regulations.',
      },
      {
        id: '6-4',
        title: '6.4 Disclaimers',
        content: 'EXCEPT AS EXPRESSLY SET FORTH HEREIN, THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" AND ARE WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, AND ANY WARRANTIES IMPLIED BY ANY COURSE OF PERFORMANCE, USAGE OF TRADE, OR COURSE OF DEALING, ALL OF WHICH ARE EXPRESSLY DISCLAIMED. COMPANY DOES NOT WARRANT THAT THE SERVICES WILL MEET CUSTOMER\'S REQUIREMENTS OR RESULT IN ANY OUTCOME, OR THAT THEIR OPERATION WILL BE UNINTERRUPTED OR ERROR-FREE.',
      },
    ],
  },
  {
    id: '7',
    title: '7. Indemnification',
    subsections: [
      {
        id: '7-1',
        title: '7.1 Company Indemnity',
        content: 'Company agrees to defend Customer against any claim by a third party that the Services infringe a valid US patent (issued as of the Effective Date set forth in an applicable Order Form), or any copyright or trade secret, of such third party and indemnify Customer for settlement amounts or damages, liabilities, costs and expenses (including reasonable attorneys\' fees) awarded and arising out of such claim.',
      },
    ],
  },
]

export default function TermsOfServicePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['1'])
  const [expandedSubsections, setExpandedSubsections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const toggleSubsection = (subsectionId: string) => {
    setExpandedSubsections((prev) =>
      prev.includes(subsectionId)
        ? prev.filter((s) => s !== subsectionId)
        : [...prev, subsectionId]
    )
  }

  const filteredSections = sections.filter((section) => {
    const sectionMatch = section.title.toLowerCase().includes(searchTerm.toLowerCase())
    const subsectionMatch = section.subsections.some(
      (sub) =>
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof sub.content === 'string'
          ? sub.content.toLowerCase().includes(searchTerm.toLowerCase())
          : sub.content.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    return sectionMatch || subsectionMatch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
                <p className="text-muted-foreground text-sm">Last Modified: October 22, 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <Card className="p-6 mb-6 bg-blue-50 border-2 border-blue-200">
          <p className="text-sm text-foreground leading-relaxed">
            PLEASE READ THIS MASTER SERVICES AGREEMENT ("AGREEMENT") CAREFULLY BEFORE USING THE SERVICES. BY CLICKING THE "I ACCEPT" BUTTON, OR BY USING THE SERVICES IN ANY MANNER, YOU AGREE THAT YOU HAVE READ AND AGREE TO BE BOUND BY THE TERMS AND CONDITIONS OF THIS AGREEMENT, TO THE EXCLUSION OF ALL OTHER TERMS. USE OF THE SERVICES IS EXPRESSLY CONDITIONED UPON YOUR ASSENT TO ALL THE TERMS AND CONDITIONS OF THIS AGREEMENT. IF YOU CANNOT OR DO NOT AGREE TO ALL TERMS AND CONDITIONS, YOU ARE PROHIBITED FROM ACCESSING OR USING THE SERVICES.
          </p>
        </Card>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search terms of service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground bg-background"
            />
          </div>
        </Card>

        {/* Table of Contents */}
        <Card className="p-6 mb-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setSearchTerm('')
                  toggleSection(section.id)
                }}
                className="text-left text-sm text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                {section.title}
              </button>
            ))}
          </div>
        </Card>

        {/* Content Sections */}
        <div className="space-y-4">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <div key={section.id}>
                <Card
                  className="p-0 overflow-hidden cursor-pointer hover:shadow-md transition"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between p-6 bg-card hover:bg-background transition">
                    <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition ${
                        expandedSections.includes(section.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </Card>

                {expandedSections.includes(section.id) && (
                  <div className="mt-2 space-y-2 ml-2">
                    {section.subsections.map((subsection) => (
                      <Card key={subsection.id} className="p-0 overflow-hidden">
                        <button
                          onClick={() => toggleSubsection(subsection.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-background transition text-left"
                        >
                          <h3 className="font-medium text-foreground text-sm">{subsection.title}</h3>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition flex-shrink-0 ${
                              expandedSubsections.includes(subsection.id) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expandedSubsections.includes(subsection.id) && (
                          <div className="px-4 pb-4 bg-background border-t">
                            {typeof subsection.content === 'string' ? (
                              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {subsection.content}
                              </p>
                            ) : (
                              <ul className="space-y-3">
                                {subsection.content.map((item, idx) => (
                                  <li key={idx} className="text-foreground text-sm leading-relaxed">
                                    <p>{item}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sections found matching your search</p>
            </Card>
          )}
        </div>

        {/* Acceptance Footer */}
        <Card className="p-6 mt-8 bg-green-50 border-2 border-green-200">
          <h3 className="font-semibold text-foreground mb-2">Acceptance of Terms</h3>
          <p className="text-sm text-foreground mb-4">
            By accessing and using this service, you acknowledge that you have read, understood, and agree to be bound by all of the terms and conditions outlined in this Agreement.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-background text-foreground rounded-lg hover:bg-card transition border border-border font-medium text-sm"
            >
              Decline
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              I Accept
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
