import { Outlet } from '@tanstack/react-router';
import { RootContainer } from '$/view/root-container';

export const RootLayout = () => (
    <RootContainer>
        <Outlet />
    </RootContainer>
);
