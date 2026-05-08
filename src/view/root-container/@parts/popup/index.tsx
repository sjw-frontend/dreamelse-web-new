// @ts-nocheck
import type { PopupTypes, ReactTypes } from '$/types';
import { optimize } from '$/view/optimize';
import { Toast } from './@parts/toast';
import { Dialog } from './@parts/dialog';
import { Loader } from './@parts/loader';
import { SingleInputDialog } from './@parts/single-input-dialog';
import { DualInputDialog } from './@parts/dual-input-dialog';
import { MultilineInputDialog } from './@parts/multiline-input-dialog';
import { ImageViewer } from './@parts/image-viewer';

export const Popup: ReactTypes.FC<PopupTypes.PopupInfo & {
    onCloseSingleInputDialog?: () => void;
    onCloseDualInputDialog?: () => void;
    onCloseMultilineInputDialog?: () => void;
    onCloseImageViewer?: () => void;
}> = optimize(props => (
    <>
        <Toast info={props.toast} />
        <Dialog info={props.dialog} />
        <Loader info={props.loader} />
        <SingleInputDialog info={props.singleInputDialog} onClose={props.onCloseSingleInputDialog ?? (() => {})} />
        <DualInputDialog info={props.dualInputDialog} onClose={props.onCloseDualInputDialog ?? (() => {})} />
        <MultilineInputDialog info={props.multilineInputDialog} onClose={props.onCloseMultilineInputDialog ?? (() => {})} />
        <ImageViewer info={props.imageViewer} onClose={props.onCloseImageViewer ?? (() => {})} />
    </>
));
