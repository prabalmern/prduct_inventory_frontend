import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTable, useSortBy, usePagination, useRowSelect } from 'react-table';
import './App.css';

function App() {
    const [data, setData] = useState([]);

    //  product data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/products');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const columns = useMemo(
        () => [
            { Header: 'ID', accessor: 'id' },
            { Header: 'Name', accessor: 'name' },
            { Header: 'Price', accessor: 'price' },
            { Header: 'Quantity', accessor: 'quantity' }
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state: { selectedRowIds, pageIndex, pageSize },
        setPageSize,
        gotoPage,
        canPreviousPage,
        canNextPage,
        previousPage,
        nextPage,
        pageCount
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0, pageSize:10 }
        },
        useSortBy,
        usePagination,
        useRowSelect,
        hooks => {
            hooks.visibleColumns.push(columns => [
                {
                    id: 'selection',
                    Header: ({ getToggleAllRowsSelectedProps }) => (
                        <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
                    ),
                    Cell: ({ row }) => (
                        <input type="checkbox" {...row.getToggleRowSelectedProps()} />
                    )
                },
                ...columns
            ]);
        }
    );

    const handleExport = async (format) => {
        try {
            const selectedIds = Object.keys(selectedRowIds).map(id => data[id].id);
            if (selectedIds.length === 0) {
                alert('No rows selected');
                return;
            }
            const response = await axios.post(`http://localhost:5000/export/${format}`, { selectedIds }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `data.${format}`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    return (
        <div className="App">
            <h1>Product Inventory</h1>
         
            <table {...getTableProps()} className="table">
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                    {column.render('Header')}
                                    <span>
                                        {column.isSorted
                                            ? column.isSortedDesc
                                                ? ' 🔽'
                                                : ' 🔼'
                                            : ''}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map(row => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()}>
                                {row.cells.map(cell => (
                                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="pagination">
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                    {'<<'}
                </button>
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                    {'<'}
                </button>
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                    {'>'}
                </button>
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                    {'>>'}
                </button>
                <span>
                    Page <strong>{pageIndex + 1} of {pageCount}</strong>{' '}
                </span>
                <span>
                    | Go to page:{' '}
                    <input
                        type="number"
                        defaultValue={pageIndex + 1}
                        onChange={e => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            gotoPage(page);
                        }}
                    />
                </span>
                <select
                    value={pageSize}
                    onChange={e => {
                        setPageSize(Number(e.target.value));
                    }}
                >
                    {[10, 20, 25].map(size => (
                        <option key={size} value={size}>
                            Show {size}
                        </option>
                    ))}
                </select>
            </div>
            <div className="buttons">
                <button onClick={() => handleExport('pdf')}>Export as PDF</button>
                <button onClick={() => handleExport('csv')}>Export as CSV</button>
                <button onClick={() => handleExport('xlsx')}>Export as XLSX</button>
            </div>
        </div>
    );
}

export default App;
