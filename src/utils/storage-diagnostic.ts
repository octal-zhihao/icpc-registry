import { supabase } from '@/lib/supabase';

export interface DiagnosticResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * 诊断 Supabase Storage 配置
 */
export async function diagnoseStorageConfiguration(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Test 1: Check Supabase client configuration
  results.push({
    test: 'Supabase Client',
    passed: !!supabase,
    message: supabase ? 'Supabase client initialized' : 'Supabase client not initialized',
  });

  // Test 2: Check bucket exists
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      results.push({
        test: 'List Buckets',
        passed: false,
        message: `Failed to list buckets: ${error.message}`,
        details: error,
      });
    } else {
      const bucketExists = buckets?.some(b => b.id === 'registration-attachments');
      results.push({
        test: 'Bucket Exists',
        passed: bucketExists,
        message: bucketExists
          ? 'registration-attachments bucket exists'
          : 'registration-attachments bucket NOT FOUND',
        details: buckets?.map(b => b.id),
      });
    }
  } catch (error: any) {
    results.push({
      test: 'List Buckets',
      passed: false,
      message: `Exception: ${error.message}`,
      details: error,
    });
  }

  // Test 3: Try to list files in bucket (tests read permission)
  try {
    const { data, error } = await supabase.storage
      .from('registration-attachments')
      .list('', { limit: 1 });

    if (error) {
      results.push({
        test: 'List Files Permission',
        passed: false,
        message: `Cannot list files: ${error.message}`,
        details: error,
      });
    } else {
      results.push({
        test: 'List Files Permission',
        passed: true,
        message: 'Can list files in bucket',
        details: { fileCount: data?.length || 0 },
      });
    }
  } catch (error: any) {
    results.push({
      test: 'List Files Permission',
      passed: false,
      message: `Exception: ${error.message}`,
      details: error,
    });
  }

  // Test 4: Check if user is authenticated
  try {
    const { data: { user } } = await supabase.auth.getUser();
    results.push({
      test: 'User Authentication',
      passed: !!user,
      message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
      details: { userId: user?.id },
    });
  } catch (error: any) {
    results.push({
      test: 'User Authentication',
      passed: false,
      message: `Exception: ${error.message}`,
      details: error,
    });
  }

  // Test 5: Test public URL generation
  try {
    const testPath = 'test/sample.jpg';
    const { data: { publicUrl } } = supabase.storage
      .from('registration-attachments')
      .getPublicUrl(testPath);

    const isValidUrl = publicUrl && publicUrl.includes('registration-attachments');
    results.push({
      test: 'Public URL Generation',
      passed: isValidUrl,
      message: isValidUrl ? 'Public URL generated correctly' : 'Invalid public URL',
      details: { sampleUrl: publicUrl },
    });
  } catch (error: any) {
    results.push({
      test: 'Public URL Generation',
      passed: false,
      message: `Exception: ${error.message}`,
      details: error,
    });
  }

  return results;
}

/**
 * 格式化诊断结果为控制台输出
 */
export function printDiagnosticResults(results: DiagnosticResult[]): void {
  console.group('🔍 Storage Configuration Diagnostic');

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.group(`${icon} Test ${index + 1}: ${result.test}`);
    console.log('Status:', result.passed ? 'PASSED' : 'FAILED');
    console.log('Message:', result.message);
    if (result.details) {
      console.log('Details:', result.details);
    }
    console.groupEnd();
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\n📊 Summary: ${passedCount}/${totalCount} tests passed`);
  console.groupEnd();
}
