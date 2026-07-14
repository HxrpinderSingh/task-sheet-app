import { Task, UserRole, TaskStatus, TaskPriority, RoleType, DeptMapping } from '../types';
import { defaultTasks, defaultRoles, defaultMappings } from '../data/defaultTasks';

// Constants for spreadsheet names
const SPREADSHEET_NAME = 'Task_Management_App_Backend';
const TASKS_SHEET = 'Tasks';
const ROLES_SHEET = 'Roles';
const USERS_SHEET = 'Users';
const MAPPINGS_SHEET = 'Mappings';

// Ensure the Users sheet exists in the Google Spreadsheet and has correct headers
export async function ensureUsersSheetExists(token: string, spreadsheetId: string, sheetIdsMapping: { [key: string]: number }): Promise<void> {
  if (sheetIdsMapping[USERS_SHEET] !== undefined) {
    return;
  }

  // Create Users sheet
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: USERS_SHEET,
              },
            },
          },
        ],
      }),
    }
  );

  // Write headers for the Users sheet
  const headers = [['Email', 'Name', 'Role', 'Department', 'Password']];
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${USERS_SHEET}!A1:E1?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${USERS_SHEET}!A1:E1`,
        majorDimension: 'ROWS',
        values: headers,
      }),
    }
  );
}

// Google API Helper to perform fetch requests
async function googleFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `Google API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg += ` - ${errorData.error?.message || JSON.stringify(errorData)}`;
    } catch {}
    throw new Error(errorMsg);
  }
  return response.json();
}

// Get Sheet GID mapping for deleting rows (since we need sheetId, not sheet name)
async function getSheetIds(token: string, spreadsheetId: string): Promise<{ [key: string]: number }> {
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    token
  );
  
  const mapping: { [key: string]: number } = {};
  if (data.sheets) {
    for (const sheet of data.sheets) {
      if (sheet.properties) {
        mapping[sheet.properties.title] = sheet.properties.sheetId;
      }
    }
  }
  return mapping;
}

// Search for existing spreadsheet in Drive
export async function findSpreadsheet(token: string): Promise<string | null> {
  const query = encodeURIComponent(
    `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  );
  const data = await googleFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
    token
  );
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

// Create spreadsheet with pre-defined headers and mock data
export async function createSpreadsheet(
  token: string,
  adminEmail: string,
  adminName: string
): Promise<{ id: string; url: string }> {
  // 1. Create the spreadsheet with four sheets
  const spreadsheetData = await googleFetch('https://sheets.googleapis.com/v4/spreadsheets', token, {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_NAME,
      },
      sheets: [
        { properties: { title: TASKS_SHEET } },
        { properties: { title: ROLES_SHEET } },
        { properties: { title: USERS_SHEET } },
        { properties: { title: MAPPINGS_SHEET } },
      ],
    }),
  });

  const spreadsheetId = spreadsheetData.spreadsheetId;
  const spreadsheetUrl = spreadsheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Define headers and initial data
  const tasksHeaders = [
    ['Task ID', 'Title', 'Description', 'Department', 'Source', 'Module', 'Assignee Email', 'Assignee Name', 'Due Date', 'Status', 'Priority', 'Created Date', 'Created By', 'Remarks', 'Activity Log']
  ];

  // Mock roles: Add admin, plus mock employee and manager
  const rolesHeaders = [
    ['Email', 'Name', 'Role', 'Department']
  ];

  const usersHeaders = [
    ['Email', 'Name', 'Role', 'Department', 'Password']
  ];

  const mappingsHeaders = [
    ['Department', 'Sources', 'Modules']
  ];

  const initialRoles = defaultRoles.map(r => [
    r.email === 'admin@example.com' ? adminEmail : r.email,
    r.email === 'admin@example.com' ? adminName : r.name,
    r.role,
    r.department
  ]);

  const initialUsers = defaultRoles.map(r => [
    r.email === 'admin@example.com' ? adminEmail : r.email,
    r.email === 'admin@example.com' ? adminName : r.name,
    r.role,
    r.department,
    r.password || 'password123'
  ]);

  const initialTasks = defaultTasks.map(t => [
    t.id,
    t.title,
    t.description,
    t.department,
    t.source,
    t.module,
    t.assigneeEmail === 'admin@example.com' ? adminEmail : t.assigneeEmail,
    t.assigneeEmail === 'admin@example.com' ? adminName : t.assigneeName,
    t.dueDate,
    t.status,
    t.priority,
    t.createdDate,
    t.createdBy === 'admin@example.com' ? adminEmail : t.createdBy,
    t.remarks || '',
    t.activityLog || '[]'
  ]);

  const initialMappings = defaultMappings.map(m => [
    m.department,
    m.sources.join(', '),
    m.modules.join(', ')
  ]);

  // Write Tasks and Roles
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASKS_SHEET}!A1:O200?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${TASKS_SHEET}!A1:O200`,
        majorDimension: 'ROWS',
        values: [...tasksHeaders, ...initialTasks],
      }),
    }
  );

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ROLES_SHEET}!A1:D100?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${ROLES_SHEET}!A1:D100`,
        majorDimension: 'ROWS',
        values: [...rolesHeaders, ...initialRoles],
      }),
    }
  );

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${USERS_SHEET}!A1:E100?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${USERS_SHEET}!A1:E100`,
        majorDimension: 'ROWS',
        values: [...usersHeaders, ...initialUsers],
      }),
    }
  );

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${MAPPINGS_SHEET}!A1:C100?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${MAPPINGS_SHEET}!A1:C100`,
        majorDimension: 'ROWS',
        values: [...mappingsHeaders, ...initialMappings],
      }),
    }
  );

  return { id: spreadsheetId, url: spreadsheetUrl };
}

// Ensure the Mappings sheet exists in the Google Spreadsheet
export async function ensureMappingsSheetExists(token: string, spreadsheetId: string, sheetIdsMapping: { [key: string]: number }): Promise<void> {
  if (sheetIdsMapping[MAPPINGS_SHEET] !== undefined) {
    return;
  }

  // Create Mappings sheet
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: MAPPINGS_SHEET,
              },
            },
          },
        ],
      }),
    }
  );

  // Write headers for the Mappings sheet
  const headers = [['Department', 'Sources', 'Modules']];
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${MAPPINGS_SHEET}!A1:C1?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${MAPPINGS_SHEET}!A1:C1`,
        majorDimension: 'ROWS',
        values: headers,
      }),
    }
  );
}

// Fetch all system mappings
export async function fetchMappings(token: string, spreadsheetId: string): Promise<DeptMapping[]> {
  try {
    const mapping = await getSheetIds(token, spreadsheetId).catch(() => ({}));
    if (mapping[MAPPINGS_SHEET] === undefined) {
      await ensureMappingsSheetExists(token, spreadsheetId, mapping);
      
      // Write initial default mappings
      const rows = defaultMappings.map(m => [m.department, m.sources.join(', '), m.modules.join(', ')]);
      await googleFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${MAPPINGS_SHEET}!A2:C${rows.length + 1}?valueInputOption=USER_ENTERED`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            range: `${MAPPINGS_SHEET}!A2:C${rows.length + 1}`,
            majorDimension: 'ROWS',
            values: rows,
          }),
        }
      );
      return defaultMappings;
    }
  } catch (err) {
    console.warn('Error checking or setting up Mappings sheet:', err);
  }

  try {
    const data = await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${MAPPINGS_SHEET}!A2:C100`,
      token
    );
    const mappings: DeptMapping[] = [];
    if (data.values && data.values.length > 0) {
      for (const row of data.values) {
        if (row[0]) {
          mappings.push({
            department: row[0].trim(),
            sources: row[1] ? row[1].split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            modules: row[2] ? row[2].split(',').map((m: string) => m.trim()).filter(Boolean) : [],
          });
        }
      }
      return mappings;
    }
  } catch (err) {
    console.warn('Failed to fetch mappings from sheet:', err);
  }
  return defaultMappings;
}

// Overwrite all system mappings in the Google Spreadsheet
export async function saveAllMappings(token: string, spreadsheetId: string, mappings: DeptMapping[]): Promise<void> {
  const rows = mappings.map(m => [m.department, m.sources.join(', '), m.modules.join(', ')]);
  
  // Fill empty values up to 50 rows to clear old mapping records
  const maxRows = Math.max(50, rows.length + 10);
  while (rows.length < maxRows) {
    rows.push(['', '', '']);
  }

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${MAPPINGS_SHEET}!A2:C${rows.length + 1}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${MAPPINGS_SHEET}!A2:C${rows.length + 1}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );
}

// Get details of a spreadsheet
export async function getSpreadsheetDetails(token: string, spreadsheetId: string): Promise<{ name: string; url: string }> {
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties`,
    token
  );
  return {
    name: data.properties?.title || SPREADSHEET_NAME,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

// Fetch all Tasks from Sheet
export async function fetchTasks(token: string, spreadsheetId: string): Promise<Task[]> {
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASKS_SHEET}!A2:O1000`,
    token
  );

  const tasks: Task[] = [];
  if (data.values && data.values.length > 0) {
    for (const row of data.values) {
      if (row[0]) { // Check if ID exists
        if (row.length <= 13) {
          // Legacy support (Department/Source split)
          const deptSource = row[3] || 'Tech Team';
          let department = 'Tech Team';
          let source = '';
          let module = '';
          
          if (deptSource === 'Marketing') {
            department = 'Marketing';
            source = 'LinkedIn';
            module = 'General';
          } else if (deptSource === 'Management' || deptSource === 'Strategy' || deptSource === 'Personal') {
            department = 'Management';
            source = deptSource;
            module = 'General';
          } else {
            department = 'Tech Team';
            source = deptSource;
            module = 'General';
          }

          tasks.push({
            id: row[0],
            title: row[1] || '',
            description: row[2] || '',
            department,
            source,
            module,
            assigneeEmail: row[4] || '',
            assigneeName: row[5] || '',
            dueDate: row[6] || '',
            status: (row[7] as TaskStatus) || 'Pending',
            priority: (row[8] as TaskPriority) || 'Medium',
            createdDate: row[9] || '',
            createdBy: row[10] || '',
            remarks: row[11] || '',
            activityLog: row[12] || '[]',
          });
        } else {
          // New 15-column format (A to O)
          tasks.push({
            id: row[0],
            title: row[1] || '',
            description: row[2] || '',
            department: row[3] || '',
            source: row[4] || '',
            module: row[5] || '',
            assigneeEmail: row[6] || '',
            assigneeName: row[7] || '',
            dueDate: row[8] || '',
            status: (row[9] as TaskStatus) || 'Pending',
            priority: (row[10] as TaskPriority) || 'Medium',
            createdDate: row[11] || '',
            createdBy: row[12] || '',
            remarks: row[13] || '',
            activityLog: row[14] || '[]',
          });
        }
      }
    }
  }
  return tasks;
}

// Fetch all User Roles (and credentials) from Sheet
export async function fetchRoles(token: string, spreadsheetId: string): Promise<UserRole[]> {
  try {
    const mapping = await getSheetIds(token, spreadsheetId).catch(() => ({}));
    if (mapping[USERS_SHEET] === undefined) {
      await ensureUsersSheetExists(token, spreadsheetId, mapping);
      
      // Migrate existing roles from Roles sheet if it exists and has rows
      if (mapping[ROLES_SHEET] !== undefined) {
        try {
          const rolesData = await googleFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ROLES_SHEET}!A2:D500`,
            token
          );
          if (rolesData.values && rolesData.values.length > 0) {
            const migratedUsers = rolesData.values.map((row: any) => [
              row[0] || '',
              row[1] || '',
              row[2] || 'employee',
              row[3] || 'General',
              'password123' // Default password for migrated accounts
            ]);
            await googleFetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${USERS_SHEET}!A2:E${migratedUsers.length + 1}?valueInputOption=USER_ENTERED`,
              token,
              {
                method: 'PUT',
                body: JSON.stringify({
                  range: `${USERS_SHEET}!A2:E${migratedUsers.length + 1}`,
                  majorDimension: 'ROWS',
                  values: migratedUsers,
                }),
              }
            );
          }
        } catch (migrationErr) {
          console.error('Failed to migrate Roles data to Users:', migrationErr);
        }
      }
    }
  } catch (err) {
    console.warn('Error checking or setting up Users sheet:', err);
  }

  // Fetch from Users sheet
  let data;
  try {
    data = await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${USERS_SHEET}!A2:E500`,
      token
    );
  } catch (err) {
    console.warn('Failed to fetch from Users sheet, falling back to Roles:', err);
    // Fallback to Roles
    data = await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${ROLES_SHEET}!A2:D500`,
      token
    );
  }

  const roles: UserRole[] = [];
  if (data.values && data.values.length > 0) {
    for (const row of data.values) {
      if (row[0]) { // Check if Email exists
        roles.push({
          email: row[0].toLowerCase().trim(),
          name: row[1] || '',
          role: (row[2]?.toLowerCase() as RoleType) || 'employee',
          department: row[3] || '',
          password: row[4] || '', // Retrieve password column
        });
      }
    }
  }
  return roles;
}

// Add a Task (Appends to Sheet)
export async function addTask(token: string, spreadsheetId: string, task: Task): Promise<void> {
  const rowValues = [
    task.id,
    task.title,
    task.description,
    task.department || '',
    task.source || '',
    task.module || '',
    task.assigneeEmail,
    task.assigneeName,
    task.dueDate,
    task.status,
    task.priority,
    task.createdDate,
    task.createdBy,
    task.remarks || '',
    task.activityLog || '[]',
  ];

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASKS_SHEET}!A:O:append?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );
}

// Update a Task
export async function updateTask(token: string, spreadsheetId: string, task: Task): Promise<void> {
  // First fetch all tasks to find the correct row number (2-indexed in Sheets, where index 0 is headers)
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASKS_SHEET}!A1:A1000`,
    token
  );

  let rowIndex = -1;
  if (data.values) {
    for (let i = 0; i < data.values.length; i++) {
      if (data.values[i][0] === task.id) {
        rowIndex = i + 1; // 1-based index in sheets
        break;
      }
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Task with ID ${task.id} was not found in the spreadsheet.`);
  }

  const rowValues = [
    task.id,
    task.title,
    task.description,
    task.department || '',
    task.source || '',
    task.module || '',
    task.assigneeEmail,
    task.assigneeName,
    task.dueDate,
    task.status,
    task.priority,
    task.createdDate,
    task.createdBy,
    task.remarks || '',
    task.activityLog || '[]',
  ];

  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASKS_SHEET}!A${rowIndex}:O${rowIndex}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${TASKS_SHEET}!A${rowIndex}:O${rowIndex}`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );
}

// Delete a Task
export async function deleteTask(token: string, spreadsheetId: string, taskId: string): Promise<void> {
  // 1. Fetch task IDs to locate row
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${TASKS_SHEET}!A1:A1000`,
    token
  );

  let rowIndex = -1;
  if (data.values) {
    for (let i = 0; i < data.values.length; i++) {
      if (data.values[i][0] === taskId) {
        rowIndex = i; // 0-based index for API deletion request
        break;
      }
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Task with ID ${taskId} was not found in the spreadsheet.`);
  }

  // 2. Fetch sheet IDs
  const mapping = await getSheetIds(token, spreadsheetId);
  const sheetId = mapping[TASKS_SHEET];

  if (sheetId === undefined) {
    throw new Error(`Sheet '${TASKS_SHEET}' not found in the spreadsheet properties.`);
  }

  // 3. Request row deletion
  await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      }),
    }
  );
}

// Add or Update User Role (with Password credentials)
export async function saveUserRole(token: string, spreadsheetId: string, userRole: UserRole): Promise<void> {
  // Try to use USERS_SHEET, with ROLES_SHEET as backup
  let activeSheet = USERS_SHEET;
  try {
    const mapping = await getSheetIds(token, spreadsheetId).catch(() => ({}));
    if (mapping[USERS_SHEET] === undefined) {
      activeSheet = ROLES_SHEET; // Fallback to Roles if Users sheet is somehow missing
    }
  } catch (err) {
    activeSheet = ROLES_SHEET;
  }

  // 1. Fetch emails to check if user already exists
  const data = await googleFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeSheet}!A1:A500`,
    token
  );

  let rowIndex = -1;
  const targetEmail = userRole.email.toLowerCase().trim();
  
  if (data.values) {
    for (let i = 0; i < data.values.length; i++) {
      if (data.values[i][0] && data.values[i][0].toLowerCase().trim() === targetEmail) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }
  }

  const rowValues = [
    targetEmail,
    userRole.name,
    userRole.role,
    userRole.department,
    userRole.password || 'password123', // Ensure a password is saved
  ];

  // If using Roles, we only save 4 columns
  const finalRowValues = activeSheet === ROLES_SHEET ? rowValues.slice(0, 4) : rowValues;
  const lastCol = activeSheet === ROLES_SHEET ? 'D' : 'E';

  if (rowIndex !== -1) {
    // Update existing row
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeSheet}!A${rowIndex}:${lastCol}${rowIndex}?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({
          range: `${activeSheet}!A${rowIndex}:${lastCol}${rowIndex}`,
          majorDimension: 'ROWS',
          values: [finalRowValues],
        }),
      }
    );
  } else {
    // Append new row
    await googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${activeSheet}!A:${lastCol}:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          values: [finalRowValues],
        }),
      }
    );
  }
}

// Delete User Role
export async function deleteUserRole(token: string, spreadsheetId: string, email: string): Promise<void> {
  const mapping = await getSheetIds(token, spreadsheetId).catch(() => ({}));
  const targetEmail = email.toLowerCase().trim();
  let deletedAny = false;

  const sheetsToTry = [USERS_SHEET, ROLES_SHEET];

  for (const sheetName of sheetsToTry) {
    const sheetId = mapping[sheetName];
    if (sheetId === undefined) continue;

    try {
      const data = await googleFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:A500`,
        token
      );

      let rowIndex = -1;
      if (data.values) {
        for (let i = 0; i < data.values.length; i++) {
          if (data.values[i][0] && data.values[i][0].toLowerCase().trim() === targetEmail) {
            rowIndex = i; // 0-based index
            break;
          }
        }
      }

      if (rowIndex !== -1) {
        await googleFetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: sheetId,
                      dimension: 'ROWS',
                      startIndex: rowIndex,
                      endIndex: rowIndex + 1,
                    },
                  },
                },
              ],
            }),
          }
        );
        deletedAny = true;
      }
    } catch (sheetErr) {
      console.warn(`Could not delete user role from sheet '${sheetName}':`, sheetErr);
    }
  }

  if (!deletedAny && Object.keys(mapping).length > 0) {
    throw new Error(`User with email ${email} was not found in any sheet roster.`);
  }
}
