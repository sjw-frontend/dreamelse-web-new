import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';

import { PDFController } from './pdf-controller';

const PDF_SOURCES: Record<string, string> = {
    TermsOfService: '/assets/pdf/terms-of-service.pdf',
    PrivacyPolicy: '/assets/pdf/privacy-policy.pdf',
};

const PDF_TITLES: Record<string, string> = {
    TermsOfService: '用户协议',
    PrivacyPolicy: '隐私政策',
};

export const PDFPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(PDFController);
    const state = useReactive(() => ({
        pdfKind: (ctrl.state as any).route?.params?.pdfKind as string | undefined,
    }));

    const pdfKind = state.pdfKind ?? '';
    const pdfSrc = PDF_SOURCES[pdfKind] ?? '';
    const title = PDF_TITLES[pdfKind] ?? 'PDF';

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M12.5 15l-5-5 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-text"
                            />
                        </svg>
                    </button>
                    <span className="text-text text-lg font-semibold">{title}</span>
                </div>

                {/* PDF viewer */}
                <div className="flex-1 overflow-hidden">
                    {pdfSrc ? (
                        <iframe
                            src={pdfSrc}
                            title={title}
                            className="w-full h-full border-none bg-bg-page"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-text/40 text-sm">暂无内容</span>
                        </div>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
