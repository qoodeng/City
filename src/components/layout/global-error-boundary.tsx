"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-city-black p-4">
                    <div className="w-full max-w-md space-y-4 rounded-lg border border-red-900/50 bg-red-950/10 p-6 text-center">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-red-900/20 p-3">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-red-500">
                                Application Error
                            </h2>
                            <p className="text-sm text-gray-400">
                                Something went wrong. The application has been stopped to prevent
                                data corruption.
                            </p>
                        </div>
                        {this.state.error && (
                            <div className="relative rounded bg-black/50 p-3 text-left">
                                <pre className="overflow-auto text-xs font-mono text-red-400 max-h-32">
                                    {this.state.error.toString()}
                                </pre>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center pt-2">
                            <Button
                                onClick={() => window.location.reload()}
                                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Application
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
