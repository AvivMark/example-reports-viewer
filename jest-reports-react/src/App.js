import React, { useState, useEffect } from 'react';
import './App.css';
import { Bar } from 'react-chartjs-2'; // Using Bar chart for test results
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registering the required chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [selectedReportName, setSelectedReportName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    fetchReports();  // Fetch reports on initial load
  }, []);

  const fetchReports = () => {
    fetch('http://localhost:5000/api/reports')
      .then((response) => response.json())
      .then((data) => setReports(data))
      .catch((error) => console.error('Error fetching reports:', error));
  };

  const handleReportClick = (report) => {
    setCurrentReport(report);
    setSelectedReportName(removeExtension(report.fileName));
  };

  const removeExtension = (filename) => filename.replace(/\.json$/, '');

  // Create chart data based on the report
  const createChartData = (report) => {
    const passed = report.content.numPassedTests;
    const failed = report.content.numFailedTests;
    const pending = report.content.numPendingTests;

    return {
      labels: ['Passed', 'Failed', 'Pending'],
      datasets: [
        {
          label: 'Test Results',
          data: [passed, failed, pending],
          backgroundColor: ['#4CAF50', '#FF5252', '#FFEB3B'],
          borderColor: ['#4CAF50', '#FF5252', '#FFEB3B'],
          borderWidth: 1,
        },
      ],
    };
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const formData = new FormData();
    const file = event.target.files[0]; // Get the first file

    if (file) {
      formData.append('report', file); // Append file to FormData

      // Send the file to the server using POST request
      fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            setUploadError(data.error);  // Display error if there is one
            setUploadSuccess('');
          } else {
            setUploadSuccess(data.message);  // Display success message
            setUploadError('');
            fetchReports(); // Refresh report list after successful upload
          }
        })
        .catch((error) => {
          setUploadError('Failed to upload the file');  // Display error
          setUploadSuccess('');
        });
    }
  };

  return (
    <div className="App">
      <h1>Jest Report Viewer</h1>

      <h2>{selectedReportName ? `Selected Report: ${selectedReportName}` : 'Select a Report to View'}</h2>

      <div className="container">
        <div className="sidebar">
          <h2>Available Reports</h2>
          <ul>
            {reports.map((report, index) => (
              <li key={index} onClick={() => handleReportClick(report)} className="report-item">
                {removeExtension(report.fileName)}
              </li>
            ))}
          </ul>
        </div>

        <div className="main-content">
          {currentReport ? (
            <>
              <div className="summary">
                <h2>Test Summary</h2>
                <p>Total Tests: <span>{currentReport.content.numTotalTests}</span></p>
                <p>Passed: <span>{currentReport.content.numPassedTests}</span></p>
                <p>Failed: <span>{currentReport.content.numFailedTests}</span></p>
                <p>Pending: <span>{currentReport.content.numPendingTests}</span></p>
              </div>

              {/* Chart Section */}
              <div className="chart-container">
                <Bar data={createChartData(currentReport)} />
              </div>

              <div className="test-details">
                <h2>Test Details</h2>
                <ul>
                  {currentReport.content.testResults.flatMap((testFile) => testFile.testResults).map((test, index) => (
                    <li key={index} className={test.status === 'passed' ? 'passed' : 'failed'}>
                      <strong>{test.fullName}</strong><br />
                      Status: {test.status}
                      {test.failureMessages.length > 0 && (
                        <div className="failure-messages">
                          <strong>Failure Messages:</strong>
                          <ul>
                            {test.failureMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p>Select a report from the left to see the details</p>
          )}
        </div>
      </div>

      <div className="upload-section">
        <h3>Upload a New Jest JSON Report</h3>
        <input type="file" accept=".json" onChange={handleFileUpload} />
        {uploadError && <p className="error">{uploadError}</p>}
        {uploadSuccess && <p className="success">{uploadSuccess}</p>}
      </div>

      <button className="clear-btn" onClick={() => setCurrentReport(null)}>
        Clear Selected Report
      </button>
    </div>
  );
}

export default App;
