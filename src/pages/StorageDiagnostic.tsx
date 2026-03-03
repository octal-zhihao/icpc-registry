import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { diagnoseStorageConfiguration, printDiagnosticResults, DiagnosticResult } from '@/utils/storage-diagnostic';
import { Loader2, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function StorageDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useAuthStore();

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const diagnosticResults = await diagnoseStorageConfiguration();
      setResults(diagnosticResults);
      printDiagnosticResults(diagnosticResults);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      runDiagnostic();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">需要管理员权限才能访问此页面</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Storage 配置诊断</h1>
          <p className="text-gray-500 mt-1">检查 Supabase Storage 配置是否正确</p>
        </div>
        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              检测中...
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              重新检测
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>诊断结果</CardTitle>
            <CardDescription>
              {passedCount === totalCount ? (
                <span className="text-green-600 font-medium">
                  ✅ 所有检查都通过了！({passedCount}/{totalCount})
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ⚠️ 发现 {totalCount - passedCount} 个问题 ({passedCount}/{totalCount} 通过)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{result.test}</h3>
                      <p className={`text-sm ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                        {result.message}
                      </p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                            查看详细信息
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            点击"重新检测"按钮开始诊断
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>常见问题解决方案</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Bucket 不存在</h3>
            <p className="text-sm text-gray-600 mb-2">
              如果检测到 bucket 不存在，请在 Supabase Dashboard 的 SQL Editor 中执行：
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-attachments', 'registration-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. 权限策略缺失</h3>
            <p className="text-sm text-gray-600 mb-2">
              如果无法列出或访问文件，请执行权限策略设置：
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`-- 允许公开查看
CREATE POLICY "Allow public view"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'registration-attachments');

-- 允许认证用户上传
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'registration-attachments');`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. 检查浏览器控制台</h3>
            <p className="text-sm text-gray-600">
              打开浏览器开发者工具（F12），查看 Console 标签页，诊断工具会输出详细的调试信息。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
