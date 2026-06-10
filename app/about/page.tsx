export default function AboutPage() {
  return (
    <main style={{ padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#0f766e" }}>
          About RDCdb
        </h1>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1f2937" }}>
            What is RDCdb?
          </h2>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            <strong>RDCdb</strong>, a novel drug database, has been created to deliver
            comprehensive drug information from multiple perspectives, especially
            pharmaceutical details and biological activities. Particularly, a total
            of 2053 RDCs (A total of 229 candidates have been approved by the FDA or
            are currently in the clinical trial pipeline, while 1824 RDCs have
            undergone preclinical evaluation with available in vitro and/or in vivo
            experimental data), together with their explicit pharma-information was
            collected and provided. Moreover, a total of 1492 literature-reported
            activities were discovered, which were identified from diverse clinical
            trial pipelines, cell lines and animal models, etc. Despite their
            considerable advantages, no existing database is specifically dedicated
            to the systematic description of the biological activities and
            comprehensive biological activity and pharma-information of RDCs, and a
            comprehensive database specifically tailored to curate such data is
            highly warranted.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1f2937" }}>
            What is the Radionuclide Drug Conjugates (RDCs)?
          </h2>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            RDCs consist of several key components: <strong>Ligand</strong>,{" "}
            <strong>Radionuclide</strong>, <strong>Chelator</strong>,{" "}
            <strong>Linker</strong>, and <strong>Cold compound</strong>. Below is a
            brief introduction to each component:
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Ligand
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            The targeting ligand in RDCs serves as the crucial mediator for
            accurately delivering radionuclides to targets on cancer cells or other
            target cells through vectors including small molecules, peptides and
            antibodies (Sig Transduct Target Ther 10, 1, 2025).
          </p>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            An ideal ligand should possess suitable binding affinity and specificity
            for the intended target. Furthermore, this moiety should also exhibit a
            plasma half-life compatible with the radionuclide, thereby maximizing
            therapeutic efficacy while minimizing potential off-target uptake and
            hematotoxicity.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Radionuclide
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            Radionuclides, the core of RDCs, are categorized as diagnostic or
            therapeutic. With PET/SPECT, diagnostic radionuclides enable rapid,
            precise whole-body lesion monitoring and noninvasive, quantitative,
            real-time target-expression assessment. Therapeutic radionuclides, via
            radiation energy, induce DNA single- or double-strand breaks that lead
            to cell death. (Theranostics 11, 7911-7947, 2021.)
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Chelator
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            In RDCs, the chelator serves as the linker between the radionuclide and
            the functional ligand, primarily functioning to sequester the
            radionuclide and prevent its leakage. An ideal chelator exhibits strong
            coordination ability as well as high kinetic and thermodynamic stability
            (Biomedicine & Pharmacotherapy, Volume 165, 2023).
          </p>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            Currently, an increasing number of chelators with more novel structures
            — based on both macrocyclic and acyclic chelating agents — are being
            developed, which can effectively enhance chelation efficiency and ensure
            thermodynamic stability within the complexes (Inorg. Chem. 62,
            20549-20566, 2023).
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Linker
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            The selection of an appropriate linker—responsible for bridging the
            ligand and the chelator—is critical in RDC design, as it improves in
            vivo stability (reducing hematological toxicity and radiolytic
            degradation). Numerous studies have demonstrated that linker
            modification can further refine pharmacokinetic profiles, including
            biodistribution, tumor uptake, and tumor-to-background ratio. Linkers
            used in RDC development can be broadly categorized into functional amino
            acid linkers, linkers conjugated with albumin-binding moieties,
            hydrophilic linkers, and flexible PEG-based linkers, etc. (Seminars in
            Nuclear Medicine, 49, 5, 339-356, 2019).
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Cold compound
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            A cold compound is defined as a non-radiolabeled compound. A given
            chemical structure can be labeled with different radionuclides, thereby
            enabling theranostic pairing. Labeling an identical cold compound with
            distinct radionuclides elicits different biological
            behaviors—including variations in chelation stability and in vivo
            pharmacokinetics—highlighting the importance of matching the
            radionuclide to the chemical structure (Theranostics, 12 (1), 232-259,
            2022).
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Biodistribution
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            In contrast to conventional biologics, greater emphasis is placed on
            tumor uptake and off-target accumulation in radionuclide drug conjugates
            (RDCs), and structural optimization is employed to suppress off-target
            uptake and thereby reduce off-target toxicity (Nature 630, 206-213,
            2024). Small-molecule ligand-based RDCs exhibit limited tumor retention
            owing to their rapid metabolic clearance, which compromises therapeutic
            efficacy. Antibody-based RDCs, by virtue of the prolonged circulation
            half-life of the antibody, frequently induce hematological toxicity and
            high background signals. Peptide-based RDCs, conversely, demonstrate
            marked accumulation in metabolic organs—particularly the kidneys—due to
            renal processing, substantially restricting in vivo investigations. To
            date, numerous strategies have been devised to modulate the absorption,
            distribution, metabolism, and excretion (ADME) profiles of RDCs, such
            as extending tumor residence time, fine-tuning the half-life, and
            accelerating renal clearance. Collectively, these approaches can
            effectively enhance tumor uptake and retention, increase the
            tumor-to-background ratio, and reduce RDC accumulation in non-target
            metabolic organs.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Mechanism of action
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            RDCs permit precise, ligand-mediated delivery of radionuclides to
            targets that are selectively expressed on the surface of cancer cells.
            Upon target binding, therapeutic RDCs (β- and α-emitters) elicit direct
            cell death via radiation-induced single- or double-stranded DNA breaks,
            base damage, and crosslinks. Besides, this emerging clinical cancer
            therapy integrates intrinsic theranostic capabilities with a &quot;crossfire&quot;
            mechanism—killing cancer cells even without direct targeting—and
            functions independently of the biological routes used for binding
            targets (Nat. Rev. Drug Discov. 19, 589-608, 2020). Diagnostic RDCs
            (γ-emitters), when paired with positron emission tomography (PET) or
            single-photon emission computed tomography (SPECT), enable non-invasive,
            quantitative, real-time evaluation of target expression in lesions (Nat.
            Med. 28, 606-608, 2022).
          </p>
        </section>
      </div>
    </main>
  );
}
