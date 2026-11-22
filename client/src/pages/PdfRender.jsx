import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {resumeAPI} from "@/api/api";
import ClassicTemplate from "@/components/templates/ClassicTemplate";
import ModernTemplate from "@/components/templates/ModernTemplate";
import MinimalTemplate from "@/components/templates/MinimalTemplate";
import ProfessionalTemplate from "@/components/templates/ProfessionalTemplate";
import ProfessionalV2Template from "@/components/templates/ProfessionalV2Template";
import Professional2Template from "@/components/templates/Professional2Template";
import ExecutiveTemplate from "@/components/templates/ExecutiveTemplate";
import TechTemplate from "@/components/templates/TechTemplate";
import Creative2Template from "@/components/templates/Creative2Template";
import StrategicLeadershipTemplate from "@/components/templates/StrategicLeadershipTemplate";
import ImpactProTemplate from "@/components/templates/ImpactProTemplate";
import GitHubStyleTemplate from "@/components/templates/GitHubStyleTemplate";
import StructuredPhotoTemplate from "@/components/templates/StructuredPhotoTemplate";
import SiliconValleyTemplate from "@/components/templates/SiliconValleyTemplate";
import LatexAcademicTemplate from "@/components/templates/LatexAcademicTemplate";
import NordicSplitTemplate from "@/components/templates/NordicSplitTemplate";
import { buildResumeLayoutCssVars } from "@/components/editor/utils/resumeLayoutUtils";

const templates = {
  "silicon-valley": SiliconValleyTemplate,
  siliconValley: SiliconValleyTemplate,
  "latex-academic": LatexAcademicTemplate,
  latexAcademic: LatexAcademicTemplate,
  "nordic-split": NordicSplitTemplate,
  nordicSplit: NordicSplitTemplate,
  executive: ExecutiveTemplate,
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  professional: ProfessionalTemplate,
  "professional-v2": ProfessionalV2Template,
  professionalV2: ProfessionalV2Template,
  "professional-2": Professional2Template,
  professional2: Professional2Template,
  tech: TechTemplate,
  "creative-2": Creative2Template,
  creative2: Creative2Template,
  "strategic-leader": StrategicLeadershipTemplate,
  "strategic-leadership": StrategicLeadershipTemplate,
  "stratergic-leader": StrategicLeadershipTemplate,
  "impact-pro": ImpactProTemplate,
  "github-style": GitHubStyleTemplate,
  githubstyle: GitHubStyleTemplate,
  GitHubStyle: GitHubStyleTemplate,
  "structured-photo": StructuredPhotoTemplate,
};

const PdfRender = () => {
  const {token} = useParams();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPdfSession = async () => {
      try {
        const {data} = await resumeAPI.getPdfSession(token);
        setPayload(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load PDF export session"
        );
      }
    };

    loadPdfSession();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        {error}
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        Preparing resume...
      </div>
    );
  }

  const SelectedTemplate = templates[payload.template] || ClassicTemplate;

  const layoutSettings = payload.resumeData?.layoutSettings || {};
  const builtLayout = buildResumeLayoutCssVars({
    layoutSettings,
    density: payload.resumeData?.density || "medium",
    fontPairing: payload.resumeData?.fontPairing || "modernSans",
  });
  const layoutStyle = {
    "--resume-layout-top": builtLayout["--resume-layout-top"],
    "--resume-layout-side": builtLayout["--resume-layout-side"],
    "--resume-layout-bottom": builtLayout["--resume-layout-bottom"],
    "--resume-layout-scale": builtLayout["--resume-layout-scale"],
    "--resume-layout-spacing": builtLayout["--resume-layout-spacing"],
    "--resume-layout-font-family": builtLayout["--resume-layout-font-family"],
    "--resume-layout-bullet-color": builtLayout["--resume-layout-bullet-color"],
  };

  return (
    <main className="bg-white text-black">
      <style>{`
        @page { size: A4; margin: 0; }
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm;
          min-height: 297mm;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .resume-preview {
          box-shadow: none !important;
          border: none !important;
          margin: 0 auto !important;
        }
        .no-print {
          display: none !important;
        }
      `}</style>
      <div id="pdf-render-ready" style={{width: "210mm", minHeight: "297mm"}}>
        <div
          className="resume-layout-shell"
          style={layoutStyle}
          data-contact={layoutSettings.contactLayout || "center-inline"}
          data-density={payload.resumeData?.density || "medium"}
        >
          <SelectedTemplate
            resumeData={payload.resumeData}
            twoPageMode={false}
            printMode={payload.template === "professional-v2"}
            onPageUsageChange={() => {}}
          />
        </div>
      </div>
    </main>
  );
};

export default PdfRender;
