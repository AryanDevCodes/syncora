import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                console.log('🔐 OAuth callback - extracting tokens from URL');
                const accessToken = searchParams.get('accessToken');
                const refreshToken = searchParams.get('refreshToken');
                const userId = searchParams.get('userId');
                const email = searchParams.get('email');
                const avatarUrl = searchParams.get('avatarUrl');

                if (!accessToken || !refreshToken || !userId || !email) {
                    console.error('❌ Missing OAuth parameters');
                    navigate('/auth?error=oauth_failed');
                    return;
                }

                console.log('✅ OAuth tokens received');
                console.log('📧 User email:', email);
                console.log('🆔 User ID:', userId);
                if (avatarUrl) {
                    console.log('🖼️ Avatar URL:', avatarUrl);
                }

                // Store tokens in localStorage (AuthContext will pick them up)
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user_id', userId);
                localStorage.setItem('userEmail', email);
                if (avatarUrl) {
                    localStorage.setItem('avatarUrl', avatarUrl);
                }

                console.log('💾 Tokens stored in localStorage');

                // Dispatch a custom event to notify AuthContext of the change
                window.dispatchEvent(new Event('oauth-tokens-stored'));

                console.log('🔄 Redirecting to dashboard...');
                // Force full reload to ensure AuthContext re-initializes with new tokens
                window.location.href = '/dashboard';
            } catch (error) {
                console.error('❌ OAuth callback error:', error);
                navigate('/auth?error=oauth_failed');
            }
        };

        handleOAuthCallback();
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
                <p className="text-sm text-gray-600 mt-2">Please wait while we set up your account</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
