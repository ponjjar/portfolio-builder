import JSZip from 'jszip';
import Papa from 'papaparse';
import { Experience, Education } from '@/domain/portfolio/types';

export async function parseLinkedInExport(fileUri: string, fileType: string, fileContent?: string | ArrayBuffer): Promise<{ experiences: Experience[], education: Education[] }> {
  const experiences: Experience[] = [];
  const education: Education[] = [];

  try {
    if (fileType === 'application/zip' || fileUri.endsWith('.zip')) {
      if (!fileContent) throw new Error('File content required for zip parsing');
      const zip = new JSZip();
      const isBase64 = typeof fileContent === 'string';
      const zipData = await zip.loadAsync(fileContent, { base64: isBase64 });

      for (const [filename, fileData] of Object.entries(zipData.files)) {
        if (filename.toLowerCase().includes('positions.csv')) {
          const csvText = await fileData.async('text');
          const exps = parsePositionsCsv(csvText);
          experiences.push(...exps);
        } else if (filename.toLowerCase().includes('education.csv')) {
          const csvText = await fileData.async('text');
          const edus = parseEducationCsv(csvText);
          education.push(...edus);
        }
      }
    } else if (fileType.includes('csv') || fileUri.endsWith('.csv')) {
      if (!fileContent) throw new Error('File content required for CSV parsing');
      const csvText = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
      
      // Determine if it's positions or education by headers
      const firstLine = csvText.split('\n')[0].toLowerCase();
      if (firstLine.includes('company') || firstLine.includes('title')) {
        experiences.push(...parsePositionsCsv(csvText));
      } else if (firstLine.includes('school') || firstLine.includes('degree')) {
        education.push(...parseEducationCsv(csvText));
      } else {
        throw new Error('Unrecognized CSV format. Please upload Positions.csv or Education.csv');
      }
    } else {
      throw new Error('Unsupported file type. Please upload a .zip or .csv file.');
    }
  } catch (error: any) {
    console.error('LinkedIn parse error:', error);
    throw new Error('Failed to parse LinkedIn export: ' + error.message);
  }

  return { experiences, education };
}

function parsePositionsCsv(csvText: string): Experience[] {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const results: Experience[] = [];

  parsed.data.forEach((row: any, index: number) => {
    const company = row['Company Name'] || row['Company'] || '';
    const title = row['Title'] || row['Job Title'] || '';
    if (!company && !title) return;

    // Convert dates from formats like 'Oct 2021' to '2021-10'
    const startDate = formatDate(row['Started On'] || row['Start Date']);
    const endDate = formatDate(row['Finished On'] || row['End Date']);
    const current = !endDate || endDate.trim() === '';

    results.push({
      id: `li_exp_${Date.now()}_${index}`,
      company: company.substring(0, 100),
      title: title.substring(0, 120),
      location: (row['Location'] || '').substring(0, 100),
      startDate,
      endDate: current ? null : endDate,
      current,
      description: (row['Description'] || '').substring(0, 1000),
    });
  });

  return results;
}

function parseEducationCsv(csvText: string): Education[] {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const results: Education[] = [];

  parsed.data.forEach((row: any, index: number) => {
    const institution = row['School Name'] || row['School'] || row['Institution'] || '';
    const course = row['Degree Name'] || row['Degree'] || row['Course'] || '';
    if (!institution && !course) return;

    const startDate = formatDate(row['Start Date'] || row['Started On']);
    const endDate = formatDate(row['End Date'] || row['Finished On']);
    const current = !endDate || endDate.trim() === '';

    results.push({
      id: `li_edu_${Date.now()}_${index}`,
      institution: institution.substring(0, 120),
      course: course.substring(0, 120),
      degree: (row['Degree Name'] || '').substring(0, 80),
      fieldOfStudy: (row['Field Of Study'] || '').substring(0, 120),
      startDate,
      endDate: current ? null : endDate,
      current,
      description: (row['Notes'] || row['Description'] || '').substring(0, 800),
    });
  });

  return results;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  // Simple mapping for 'MMM YYYY' -> 'YYYY-MM'
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  
  const parts = dateStr.trim().split(' ');
  if (parts.length === 2) {
    const month = months[parts[0].toLowerCase().substring(0, 3)];
    const year = parts[1];
    if (month && year) return `${year}-${month}`;
  }
  
  // If already YYYY-MM or couldn't parse, just return as is (max 20 chars for safety)
  return dateStr.substring(0, 20);
}
