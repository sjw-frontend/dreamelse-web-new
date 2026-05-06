// @ts-nocheck
import type { PopupTypes, ReactTypes } from '$/types';
import { optimize } from '$/view/optimize';
import { Toast } from './@parts/toast';
import { Dialog } from './@parts/dialog';
import { Loader } from './@parts/loader';

export const Popup: ReactTypes.FC<PopupTypes.PopupInfo> = optimize(props => (
    <>
        <Toast info={props.toast} />
        <Dialog info={props.dialog} />
        <Loader info={props.loader} />
        {/* Panel, ActionSheet, Menu, ImageViewer, etc. — stub for now */}
    </>
));
