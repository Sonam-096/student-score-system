// Initialize Socket.IO connection
const socket = io();

document.addEventListener('DOMContentLoaded', async () => {
    // Authentication Check 
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    const userRole = sessionStorage.getItem('userRole');
    const studentId = sessionStorage.getItem('studentId');
    const studentRollNo = sessionStorage.getItem('studentRollNo');
    const studentName = sessionStorage.getItem('studentName');
    const studentClass = sessionStorage.getItem('studentClass');
    const studentSection = sessionStorage.getItem('studentSection');
    const studentFather = sessionStorage.getItem('studentFatherName');
    const studentMother = sessionStorage.getItem('studentMotherName');

    if (!isAuthenticated || userRole !== 'student' || !studentId) {
        window.location.href = 'index.html';
        return;
    }

    //  Element References 
    const studentNameDisplay = document.getElementById('student-name');
    const studentRollNoDisplay = document.getElementById('student-rollno');
    const studentClassDisplay = document.getElementById('student-class');
    const studentSectionDisplay = document.getElementById('student-section');
    const studentFatherDisplay = document.getElementById('student-father');
    const studentMotherDisplay = document.getElementById('student-mother');

    const totalMarksDisplay = document.getElementById('total-marks');
    const percentageDisplay = document.getElementById('percentage');
    const gradeDisplay = document.getElementById('grade');
    const studentMarksTableBody = document.querySelector('#student-marks-table tbody');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    
    const EXAM_TYPES = ['unit1', 'unit2', 'half_yearly', 'unit3', 'unit4', 'yearly'];
    const SUBJECTS = ['math', 'science', 'hindi', 'english', 'sst', 'gk', 'drawing', 'moral_science'];
    const SUBJECT_NAMES = {
        'math': 'Math',
        'science': 'Science',
        'hindi': 'Hindi',
        'english': 'English',
        'sst': 'SST',
        'gk': 'GK',
        'drawing': 'Drawing',
        'moral_science': 'Moral Science'
    };

    let studentMarksData = {};

    // Helper to display marks or '-'
    const displayMark = (mark) => mark !== null ? mark : '-';

    // Function to calculate grade based on percentage
    function calculateGrade(percentage) {
        if (percentage === null || isNaN(percentage)) return '--';
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        if (percentage >= 33) return 'D';
        return 'F';
    }

    // Function to fetch and display student's marks
    async function fetchAndDisplayMarks() {
        studentMarksTableBody.innerHTML = '<tr><td colspan="7" class="no-data">Loading marks...</td></tr>';
        totalMarksDisplay.textContent = '--';
        percentageDisplay.textContent = '--%';
        gradeDisplay.textContent = '--';
        gradeDisplay.classList.remove('fail');

        try {
            const response = await fetch(`http://localhost:3000/api/students/${studentId}/marks`);
            const marksData = await response.json();

            console.log('API Response for student marks:', marksData);

            if (!response.ok) {
                const errorMsg = marksData.error || 'Failed to fetch your marks.';
                throw new Error(errorMsg);
            }

            studentMarksData = marksData;
            studentMarksTableBody.innerHTML = '';

            let overallTotalMarks = 0; 
            let marksCounted = 0; 

            if (Object.keys(marksData).length <= 1) { 
                studentMarksTableBody.innerHTML = '<tr><td colspan="7" class="no-data">No marks assigned yet.</td></tr>';
                if (typeof showNotification === 'function') {
                    showNotification('info', 'No marks found for you yet.');
                }
                return;
            }

            SUBJECTS.forEach(subject => {
                const row = studentMarksTableBody.insertRow();
                row.insertCell().textContent = SUBJECT_NAMES[subject] || subject; 

                let hasAnyMark = false; 

                EXAM_TYPES.forEach(examType => {
                    const markKey = `${examType}_${subject}`;
                    const markValue = marksData[markKey];
                    row.insertCell().textContent = displayMark(markValue);

                    if (markValue !== null) { 
                        overallTotalMarks += markValue;
                        marksCounted++; 
                        hasAnyMark = true;
                    }
                });
            });

            const maxMarksPerSubject = 100; 
            const totalPossibleOverallMarks = SUBJECTS.length * EXAM_TYPES.length * maxMarksPerSubject;

            let percentage = null;
            if (marksCounted > 0) { 
                percentage = (overallTotalMarks / totalPossibleOverallMarks) * 100;
                percentage = parseFloat(percentage.toFixed(2)); 
            }

            const grade = calculateGrade(percentage);

            totalMarksDisplay.textContent = overallTotalMarks !== 0 ? overallTotalMarks : '--'; 
            percentageDisplay.textContent = percentage !== null ? `${percentage}%` : '--%';
            gradeDisplay.textContent = grade;

            if (grade === 'F') { 
                gradeDisplay.classList.add('fail');
            } else {
                gradeDisplay.classList.remove('fail');
            }

        } catch (error) {
            console.error('Error fetching student marks:', error);
            studentMarksTableBody.innerHTML = `<tr><td colspan="7" class="no-data">Error loading your marks: ${error.message}</td></tr>`;
            if (typeof showNotification === 'function') {
                showNotification('error', `Failed to load your marks: ${error.message}`);
            } else {
                alert(`Failed to load your marks: ${error.message}`);
            }
        }
    }

    // Function to download PDF using jsPDF direct drawing
    async function downloadResultPdf() {
        downloadPdfBtn.disabled = true;
        downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';

        try {
            // Use the jsPDF instance from window.jspdf.jsPDF
            const { jsPDF } = window.jspdf;
            
            // Create a new jsPDF instance
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const margin = 15;
            let y = 20; 

            // School Header 
            const schoolLogo = new Image();
            schoolLogo.src = '../images/school_logo.jpg';
            
            await new Promise(resolve => {
                schoolLogo.onload = () => resolve();
                schoolLogo.onerror = () => {
                    console.warn('School logo failed to load for PDF. Proceeding without it.');
                    resolve();
                };
            });

            // Circular logo with proper spacing
            if (schoolLogo.complete && schoolLogo.naturalWidth > 0) {
                // Create circular mask
                const canvas = document.createElement('canvas');
                canvas.width = 140; // Higher resolution for better quality
                canvas.height = 140;
                const ctx = canvas.getContext('2d');
                
                // Draw circle
                ctx.beginPath();
                ctx.arc(70, 70, 65, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                
                
                ctx.drawImage(schoolLogo, 0, 0, 140, 140);
                
                // Add white border
                ctx.beginPath();
                ctx.arc(70, 70, 65, 0, Math.PI * 2);
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#3498db';
                ctx.stroke();
                
                const logoData = canvas.toDataURL('image/png');
                doc.addImage(logoData, 'PNG', doc.internal.pageSize.width / 2 - 25, y, 50, 50);
                y += 60; // Space after logo
            }

            // School name with proper spacing
            doc.setFontSize(22);
            doc.setTextColor(52, 152, 219); 
            doc.setFont("helvetica", "bold");
            doc.text("Akshar Public School", doc.internal.pageSize.width / 2, y, { align: "center" });
            y += 10;

            // Subtitle
            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100); 
            doc.setFont("helvetica", "normal");
            doc.text("Student Result Card", doc.internal.pageSize.width / 2, y, { align: "center" });
            y += 15;

            // Decorative line
            doc.setDrawColor(52, 152, 219); 
            doc.setLineWidth(0.5);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 15;

            //  Student Information 
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Student Information", margin, y);
            y += 8;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");

            const studentInfo = [
                { label: "Name:", value: studentName || '-' },
                { label: "Roll No.:", value: studentRollNo || '-' },
                { label: "Class:", value: studentClass || '-' },
                { label: "Section:", value: studentSection || '-' },
                { label: "Father's Name:", value: studentFather || '-' },
                { label: "Mother's Name:", value: studentMother || '-' }
            ];

            let xOffset = margin;
            const colWidth = (doc.internal.pageSize.width - 2 * margin) / 3;
            const rowHeight = 8;

            studentInfo.forEach((item, index) => {
                const col = index % 3;
                const row = Math.floor(index / 3);
                xOffset = margin + col * colWidth;
                
                doc.text(`${item.label} ${item.value}`, xOffset, y + row * rowHeight);
            });
            y += Math.ceil(studentInfo.length / 3) * rowHeight + 10;

            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;

            // Result Summary 
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Result Summary", margin, y);
            y += 8;
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");

            const overallTotalMarks = totalMarksDisplay.textContent;
            const overallPercentage = percentageDisplay.textContent;
            const overallGrade = gradeDisplay.textContent;
            const gradeColor = gradeDisplay.classList.contains('fail') ? [231, 76, 60] : [39, 174, 96];

            const summaryY = y + 5;
            const summaryItemWidth = (doc.internal.pageSize.width - 2 * margin - 2 * 10) / 3;

            // Total Marks
            doc.roundedRect(margin, summaryY, summaryItemWidth, 20, 3, 3, 'S');
            doc.text("Total Marks (Overall):", margin + summaryItemWidth / 2, summaryY + 7, { align: "center" });
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(overallTotalMarks, margin + summaryItemWidth / 2, summaryY + 15, { align: "center", textColor: [52, 152, 219] });
            
            // Percentage
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.roundedRect(margin + summaryItemWidth + 10, summaryY, summaryItemWidth, 20, 3, 3, 'S');
            doc.text("Percentage (Overall):", margin + summaryItemWidth * 1.5 + 10, summaryY + 7, { align: "center" });
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(overallPercentage, margin + summaryItemWidth * 1.5 + 10, summaryY + 15, { align: "center", textColor: [52, 152, 219] });

            // Grade
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.roundedRect(margin + summaryItemWidth * 2 + 20, summaryY, summaryItemWidth, 20, 3, 3, 'S');
            doc.text("Grade (Overall):", margin + summaryItemWidth * 2.5 + 20, summaryY + 7, { align: "center" });
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
            doc.text(overallGrade, margin + summaryItemWidth * 2.5 + 20, summaryY + 15, { align: "center" });
            doc.setTextColor(0, 0, 0);
            
            y = summaryY + 20 + 15;

            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(margin, y, doc.internal.pageSize.width - margin, y);
            y += 10;

            // Detailed Marks Table 
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Detailed Marks", margin, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            const tableHeaders = ["Subject", "Unit-1", "Unit-2", "Half Yearly", "Unit-3", "Unit-4", "Yearly"];
            const tableData = SUBJECTS.map(subject => {
                const row = [SUBJECT_NAMES[subject] || subject];
                EXAM_TYPES.forEach(examType => {
                    const markKey = `${examType}_${subject}`;
                    row.push(displayMark(studentMarksData[markKey]));
                });
                return row;
            });

            // Use autoTable plugin
            doc.autoTable({
                startY: y,
                head: [tableHeaders],
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [52, 152, 219], // Blue header
                    textColor: [255, 255, 255], // White text
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'center'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 2,
                    lineColor: [224, 224, 224],
                    lineWidth: 0.1,
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'left', cellWidth: 30 }
                },
                didDrawPage: function(data) {
                    doc.setFontSize(8);
                    doc.text('Page ' + doc.internal.getCurrentPageInfo().pageNumber, 
                            doc.internal.pageSize.width - margin, 
                            doc.internal.pageSize.height - 10, 
                            { align: 'right' });
                }
            });

            doc.save(`${studentName.replace(/\s/g, '_')}_Result_Card.pdf`);

            downloadPdfBtn.disabled = false;
            downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download Result as PDF';
            if (typeof showNotification === 'function') {
                showNotification('success', 'PDF generated successfully!');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            downloadPdfBtn.disabled = false;
            downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download Result as PDF';
            if (typeof showNotification === 'function') {
                showNotification('error', `Failed to generate PDF: ${error.message}`);
            } else {
                alert(`Failed to generate PDF: ${error.message}`);
            }
        }
    }

    // --- Initial Load ---
    studentNameDisplay.textContent = studentName || '-';
    studentRollNoDisplay.textContent = studentRollNo || '-';
    studentClassDisplay.textContent = studentClass || '-';
    studentSectionDisplay.textContent = studentSection || '-';
    studentFatherDisplay.textContent = studentFather || '-';
    studentMotherDisplay.textContent = studentMother || '-';

    fetchAndDisplayMarks();

    // --- Event Listeners ---
    downloadPdfBtn.addEventListener('click', downloadResultPdf);

    // --- Socket.IO Listeners ---
    socket.on('marks:updated', (data) => {
        if (data.student_id == studentId) { 
            fetchAndDisplayMarks();
            if (typeof showNotification === 'function') {
                showNotification('info', 'Your marks have been updated!');
            }
        }
    });

    socket.on('student:deleted', (deletedStudent) => {
        if (deletedStudent.id == studentId) {
            if (typeof showNotification === 'function') {
                showNotification('error', 'Your student record has been deleted. Logging out.');
            }
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }, 2000);
        }
    });
});