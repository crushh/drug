export default function ManualPage() {
  return (
    <main style={{ padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#0f766e" }}>
          Manual
        </h1>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1f2937" }}>
            Search for RDC
          </h2>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 16 }}>
            In the field of &quot;Search for RDC&quot;, users can find RDC entries by searching RDC name, target name, ligand name, linker name, chelator name, radionuclide name, and so on among the entire textual component of RDCdb. Query can be submitted by entering keywords into the main searching frame. The resulting webpage displays profiles of all the RDCs directly related to the search term, including RDC name, Drug status, Ligand name, Linker name, Chelator name, Radionuclide name and their information links.
          </p>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 16 }}>
            In order to facilitate a more customized input query, the wild characters of &quot;*&quot; and &quot;?&quot; are also supported.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Search Examples
          </h3>

          <div style={{ marginBottom: 20, padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <p style={{ fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>
              (1) Exact search
            </p>
            <p style={{ lineHeight: 1.8, color: "#374151" }}>
              If search &quot;[111In]In-Capromab&quot;, find a single RDC entry which is named &quot;[111In]In-Capromab&quot;;
            </p>
          </div>

          <div style={{ marginBottom: 20, padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <p style={{ fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>
              (2) Partial search
            </p>
            <p style={{ lineHeight: 1.8, color: "#374151" }}>
              If search: &quot;Capromab&quot;, finds a series entries with RDC names;
            </p>
          </div>

          <div style={{ marginBottom: 20, padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <p style={{ fontWeight: 600, color: "#1f2937", marginBottom: 8 }}>
              (3) Wildcard search
            </p>
            <p style={{ lineHeight: 1.8, color: "#374151" }}>
              If search: &quot;[111In]In-Capro*&quot;, find a single entry which is named &quot;[111In]In-Capromab&quot;;
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0f766e" }}>
            Example Usage
          </h3>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            For example, if you want to know the detail information for [111In]In-Capromab, you can search &quot;[111In]In-Capromab&quot; in the &quot;Search for RDC&quot; field.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1f2937" }}>
            Search for Other Entities
          </h2>
          <p style={{ lineHeight: 1.8, color: "#374151", marginBottom: 12 }}>
            Users can also search for other entities including Compound, Ligand, Linker, Chelator, and Radionuclide using the same search methods described above.
          </p>
        </section>
      </div>
    </main>
  );
}
