import { InfiniteSlider } from './ui/infinite-slider';
import { ProgressiveBlur } from './ui/progressive-blur';

const partners = [
  {
    id: "microsoft",
    name: "Microsoft",
    logo: (
      <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0h11.377v11.372H0z" fill="#f25022"/>
        <path d="M12.623 0H24v11.372H12.623z" fill="#7fba00"/>
        <path d="M0 12.623h11.377V24H0z" fill="#00a4ef"/>
        <path d="M12.623 12.623H24V24H12.623z" fill="#ffb900"/>
      </svg>
    ),
  },
  {
    id: "salesforce",
    name: "Salesforce",
    logo: (
      <svg viewBox="0 0 60 42" className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
        <path d="M24.8 4.6A10.6 10.6 0 0132.6 1.5a10.6 10.6 0 019.5 5.9A8.4 8.4 0 0146 6.7a8.4 8.4 0 018.4 8.4 8.4 8.4 0 01-8.4 8.4H14.4A9.9 9.9 0 014.5 13.6a9.9 9.9 0 019.9-9.9 9.9 9.9 0 0110.4.9z" fill="#00A1E0"/>
        <rect x="8" y="27" width="44" height="12" rx="6" fill="#00A1E0" opacity="0.15"/>
      </svg>
    ),
  },
  {
    id: "sap",
    name: "SAP",
    logo: (
      <svg viewBox="0 0 60 24" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="20" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="22" fill="#1A7BC4">SAP</text>
      </svg>
    ),
  },
  {
    id: "google",
    name: "Google",
    logo: (
      <svg viewBox="0 0 74 24" className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2c-1.46-1.4-3.4-2.48-6.16-2.48C4.14-.48 0 3.54 0 8.01s4.14 8.5 9.24 8.5c2.71 0 4.75-.89 6.34-2.54 1.64-1.64 2.15-3.95 2.15-5.81 0-.58-.05-1.11-.14-1.56H9.24z" fill="#4285F4" transform="translate(0, 4)"/>
        <path d="M25 6.19c-3.03 0-5.5 2.3-5.5 5.48s2.47 5.48 5.5 5.48 5.5-2.3 5.5-5.48-2.47-5.48-5.5-5.48zm0 8.8c-1.66 0-3.09-1.37-3.09-3.32s1.43-3.32 3.09-3.32 3.09 1.37 3.09 3.32-1.43 3.32-3.09 3.32z" fill="#EA4335" transform="translate(14, -1)"/>
      </svg>
    ),
  },
  {
    id: "oracle",
    name: "Oracle",
    logo: (
      <svg viewBox="0 0 80 24" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="19" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="#F80000">Oracle</text>
      </svg>
    ),
  },
  {
    id: "hubspot",
    name: "HubSpot",
    logo: (
      <svg viewBox="0 0 90 24" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="19" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="18" fill="#FF7A59">HubSpot</text>
      </svg>
    ),
  },
  {
    id: "notion",
    name: "Notion",
    logo: (
      <svg viewBox="0 0 24 24" className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#000"/>
      </svg>
    ),
  },
  {
    id: "slack",
    name: "Slack",
    logo: (
      <svg viewBox="0 0 24 24" className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
      </svg>
    ),
  },
];

interface LogosSliderProps {
  label?: string;
}

export function LogosSlider({ label = "Intégré dans les équipes de" }: LogosSliderProps) {
  return (
    <div className="w-full py-10">
      {/* Label */}
      <p className="text-center text-[12.5px] font-medium font-inter text-gray-400 uppercase tracking-[0.12em] mb-8">
        {label}
      </p>

      {/* Slider */}
      <div className="relative h-[52px] w-full overflow-hidden">
        <InfiniteSlider
          className="flex h-full w-full items-center"
          duration={35}
          gap={64}
        >
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="flex items-center justify-center"
              style={{ minWidth: 80 }}
            >
              {partner.logo}
            </div>
          ))}
        </InfiniteSlider>

        {/* Progressive blur edges */}
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 left-0 h-full w-[160px]"
          direction="left"
          blurIntensity={0.8}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 right-0 h-full w-[160px]"
          direction="right"
          blurIntensity={0.8}
        />
      </div>
    </div>
  );
}
