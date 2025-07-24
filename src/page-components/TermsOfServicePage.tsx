import { H1, H2, P } from '@/components/typography';

export const TermsOfServicePage = () => {
  return (
    <div>
      <article className="mx-auto px-4 max-w-[1400px] py-4 md:py-12">
        <H1 className="mb-4">Terms of Service</H1>
        <div className="space-y-4">
          <P>
            <strong>Last updated:</strong> May 21, 2025
          </P>
          <section aria-label="Introduction">
            <P className="pt-6">
              Welcome to AgentSmith! These Terms of Service (&quot;Terms&quot;) govern your access
              to and use of the services provided by Chad Syntax LLC (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;), including our website{' '}
              <a href="https://agentsmith.dev/" className="underline hover:text-gray-600">
                https://agentsmith.dev
              </a>{' '}
              (the &quot;Site&quot;), and any related software, applications, and services
              (collectively, the &quot;Services&quot;).
            </P>
            <P>
              By accessing or using our Services, you agree to be bound by these Terms and our
              Privacy Policy. If you do not agree to these Terms, please do not access or use our
              Services.
            </P>
          </section>

          <section aria-label="Service Sections" className="space-y-8">
            <section aria-label="Eligibility and Account Registration">
              <H2 className="mb-4">1. Eligibility and Account Registration</H2>
              <P>
                You must be at least 13 years old to use our Services. If you are under 18, you may
                only use the Services with the consent of your parent or legal guardian. By using
                the Services, you represent and warrant that you meet these eligibility
                requirements.
              </P>
              <P>
                To access certain features of the Services, you may need to register for an account.
                You agree to provide accurate, current, and complete information during the
                registration process and to update such information to keep it accurate, current,
                and complete. You are responsible for safeguarding your account password and for any
                activities or actions under your account. You agree to notify us immediately of any
                unauthorized use of your account.
              </P>
            </section>

            <section aria-label="Description of Services">
              <H2 className="mb-4">2. Description of Services</H2>
              <P>
                AgentSmith provides a platform for creating, managing, and deploying AI agents and
                prompts (&quot;Services&quot;). The specific features and functionalities of the
                Services may evolve over time. We reserve the right to modify, suspend, or
                discontinue any part of the Services at any time, with or without notice.
              </P>
            </section>

            <section aria-label="Acceptable Use Policy">
              <H2 className="mb-4">3. Acceptable Use Policy</H2>
              <P>You agree not to use the Services for any unlawful purpose or in any way that:</P>
              <ul className="list-disc pl-6 space-y-2">
                <li className="text-foreground/80">Is fraudulent, deceptive, or misleading.</li>
                <li className="text-foreground/80">
                  Infringes upon or violates any third party's rights, including intellectual
                  property rights, privacy rights, or publicity rights.
                </li>
                <li className="text-foreground/80">
                  Is defamatory, libelous, obscene, pornographic, vulgar, or offensive.
                </li>
                <li className="text-foreground/80">
                  Promotes discrimination, bigotry, racism, hatred, harassment, or harm against any
                  individual or group.
                </li>
                <li className="text-foreground/80">
                  Is violent or threatening or promotes violence or actions that are threatening to
                  any other person.
                </li>
                <li className="text-foreground/80">
                  Promotes illegal or harmful activities or substances.
                </li>
                <li className="text-foreground/80">
                  Attempts to disrupt or interfere with the Services, including by transmitting any
                  viruses, worms, defects, Trojan horses, or other items of a destructive nature.
                </li>
                <li className="text-foreground/80">
                  Attempts to gain unauthorized access to any part of the Services or its related
                  systems or networks.
                </li>
              </ul>
            </section>

            <section aria-label="User Content">
              <H2 className="mb-4">4. Your Content and Ownership</H2>
              <P>
                You are solely responsible for all content, including prompts, agent configurations,
                data, text, and other materials, that you create, develop, upload, post, or
                otherwise transmit or store using the Services (&quot;User Content&quot;). You
                retain all ownership rights, including all intellectual property rights, in your
                User Content.
              </P>
              <P>
                To enable us to provide, maintain, and improve the Services, you grant Chad Syntax
                LLC a limited, worldwide, non-exclusive, royalty-free license to use, reproduce,
                modify, display, and distribute your User Content solely for the following purposes:
              </P>
              <ul className="list-disc pl-6 space-y-2">
                <li className="text-foreground/80">
                  To operate and provide the Services to you, including storing, processing, and
                  displaying your User Content as directed by you through your use of the Services.
                </li>
                <li className="text-foreground/80">
                  To improve the Services and develop new features and functionalities. This may
                  include analysis of User Content in an aggregated and thoroughly anonymized
                  manner, designed to prevent re-identification of you or your specific User
                  Content, for statistical analysis and service enhancement.
                </li>
                <li className="text-foreground/80">
                  To address technical issues, enforce these Terms, or comply with legal
                  obligations.
                </li>
              </ul>
              <P>
                For clarity, Chad Syntax LLC will not use your User Content for any purposes not
                expressly permitted by these Terms. Specifically, we will not use your User Content
                to train our own AI models for purposes generally applicable beyond providing and
                improving the Services directly to you (unless you explicitly opt-in to such use),
                nor will we sell, or share your User Content with third parties for their own
                commercial purposes, except as necessary to provide the Services or as required by
                law.
              </P>
              <P>
                We have the right (but not the obligation) in our sole discretion to refuse or
                remove any User Content that, in our reasonable opinion, violates any of our
                policies or is in any way harmful or objectionable.
              </P>
            </section>

            <section aria-label="Intellectual Property Rights">
              <H2 className="mb-4">5. Intellectual Property Rights</H2>
              <P>
                The Services and their entire contents, features, and functionality (including but
                not limited to all information, software, text, displays, images, video, and audio,
                and the design, selection, and arrangement thereof) are owned by Chad Syntax LLC,
                its licensors, or other providers of such material and are protected by United
                States and international copyright, trademark, patent, trade secret, and other
                intellectual property or proprietary rights laws.
              </P>
              <P>
                These Terms permit you to use the Services for your personal, non-commercial use
                only, or for your internal business purposes if you are an enterprise customer. You
                must not reproduce, distribute, modify, create derivative works of, publicly
                display, publicly perform, republish, download, store, or transmit any of the
                material on our Site, except as generally permitted through the Services'
                functionality.
              </P>
            </section>

            <section aria-label="Fees and Payment">
              <H2 className="mb-4">6. Fees and Payment</H2>
              <P>
                Certain aspects of the Services may be provided for a fee or other charge. If you
                elect to use paid aspects of the Services, you agree to the pricing and payment
                terms as we may update them from time to time. Chad Syntax LLC may add new services
                for additional fees and charges, or amend fees and charges for existing services, at
                any time in its sole discretion. Any change to our pricing or payment terms shall
                become effective in the billing cycle following notice of such change to you as
                provided in these Terms.
              </P>
            </section>

            <section aria-label="Term and Termination">
              <H2 className="mb-4">7. Term and Termination</H2>
              <P>
                These Terms will remain in full force and effect while you use the Services. We may
                suspend or terminate your access to the Services at any time, for reasons such as a
                breach of these Terms, violation of applicable law, or if continued provision of the
                Services becomes commercially unviable, in our sole discretion. While we aim to
                provide notice where practicable, we reserve the right to terminate without prior
                notice or liability, particularly for severe violations.
              </P>
              <P>
                You may terminate your account and these Terms at any time by ceasing to use the
                Services and requesting account deletion if such an option is available.
              </P>
              <P>
                Upon termination, all licenses and other rights granted to you in these Terms will
                immediately cease. We will not be liable to you or any third party for termination
                of your access to the Services.
              </P>
            </section>

            <section aria-label="Disclaimers of Warranties">
              <H2 className="mb-4">8. Disclaimers of Warranties</H2>
              <P>
                THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
                NON-INFRINGEMENT.
              </P>
              <P>
                WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE,
                THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM
                AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
              </P>
            </section>

            <section aria-label="Limitation of Liability">
              <H2 className="mb-4">9. Limitation of Liability</H2>
              <P>
                TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL CHAD SYNTAX LLC,
                ITS AFFILIATES, LICENSORS, OR SERVICE PROVIDERS, OR ITS OR THEIR DIRECTORS,
                OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS
                OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES) ARISING OUT OF OR
                RELATING TO YOUR ACCESS TO OR USE OF, OR YOUR INABILITY TO ACCESS OR USE, THE
                SERVICES OR ANY MATERIALS OR CONTENT ON THE SERVICES, WHETHER BASED ON WARRANTY,
                CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, AND
                WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
              </P>
              <P>
                OUR AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE
                OF OR ANY INABILITY TO USE ANY PORTION OF THE SERVICES OR OTHERWISE UNDER THESE
                TERMS, WHETHER IN CONTRACT, TORT, OR OTHERWISE, IS LIMITED TO THE GREATER OF (I) THE
                AMOUNT YOU HAVE PAID TO CHAD SYNTAX LLC FOR ACCESS TO AND USE OF THE SERVICES IN THE
                12 MONTHS PRIOR TO THE EVENT OR CIRCUMSTANCE GIVING RISE TO CLAIM OR (II) ONE
                HUNDRED U.S. DOLLARS ($100).
              </P>
            </section>

            <section aria-label="Indemnification">
              <H2 className="mb-4">10. Indemnification</H2>
              <P>
                You agree to defend, indemnify, and hold harmless Chad Syntax LLC, its affiliates,
                licensors, and service providers, and its and their respective officers, directors,
                employees, contractors, agents, licensors, suppliers, successors, and assigns from
                and against any claims, liabilities, damages, judgments, awards, losses, costs,
                expenses, or fees (including reasonable attorneys&apos; fees) arising out of or
                relating to your violation of these Terms or your use of the Services, including,
                but not limited to, your User Content, any use of the Service&apos;s content,
                services, and products other than as expressly authorized in these Terms or your use
                of any information obtained from the Services.
              </P>
            </section>

            <section aria-label="Changes to the Terms">
              <H2 className="mb-4">11. Changes to the Terms</H2>
              <P>
                We reserve the right, in our sole discretion, to modify or replace these Terms at
                any time. If a revision is material (for example, a change that significantly alters
                your rights or obligations, such as a substantial change to fee structures or data
                usage policies), we will provide at least 30 days&apos; notice prior to any new
                terms taking effect. What constitutes a material change will be determined at our
                sole discretion.
              </P>
              <P>
                By continuing to access or use our Services after any revisions become effective,
                you agree to be bound by the revised terms. If you do not agree to the new terms,
                you are no longer authorized to use the Services.
              </P>
            </section>

            <section aria-label="Governing Law and Dispute Resolution">
              <H2 className="mb-4">12. Governing Law and Dispute Resolution</H2>
              <P>
                These Terms and any dispute or claim arising out of, or related to them, their
                subject matter, or their formation (in each case, including non-contractual disputes
                or claims) shall be governed by and construed in accordance with the internal laws
                of the State of New Hampshire without giving effect to any choice or conflict of law
                provision or rule.
              </P>
              <P>
                Any legal suit, action, or proceeding arising out of, or related to, these Terms or
                the Services shall be instituted exclusively in the federal courts of the United
                States or the courts of the State of New Hampshire located in Portsmouth, Rockingham
                County. You waive any and all objections to the exercise of jurisdiction over you by
                such courts and to venue in such courts.
              </P>
            </section>

            <section aria-label="Miscellaneous">
              <H2 className="mb-4">13. Miscellaneous</H2>
              <P>
                If any provision of these Terms is held by a court or other tribunal of competent
                jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision
                shall be eliminated or limited to the minimum extent such that the remaining
                provisions of the Terms will continue in full force and effect.
              </P>
              <P>
                These Terms, together with our Privacy Policy, constitute the sole and entire
                agreement between you and Chad Syntax LLC regarding the Services and supersede all
                prior and contemporaneous understandings, agreements, representations, and
                warranties, both written and oral, regarding the Services.
              </P>
            </section>

            <section aria-label="Contact Information">
              <H2 className="mb-4">14. Contact Information</H2>
              <P>If you have any questions about these Terms, please contact us at:</P>
              <P>
                Email:{' '}
                <a href="mailto:legal@chadsyntax.com" className="underline hover:text-gray-600">
                  legal@chadsyntax.com
                </a>
              </P>
            </section>
          </section>
        </div>
      </article>
    </div>
  );
};
