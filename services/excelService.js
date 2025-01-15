const ExcelJS = require('exceljs');
const Product = require("../models/Product");
const exportProductList = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
        { header: 'STT', key: 'stt', width: 5 },
        { header: 'Tên hàng (*)', key: 'name', width: 20 },
        { header: 'Loại (*)', key: 'type', width: 20 },
        { header: 'Trọng lượng', key: 'weights', width: 30 },
        { header: 'Số lượng', key: 'quantity', width: 30 },
        { header: 'Giá', key: 'price', width: 30 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Fetch products and populate their category names
    const products = await Product.find()
        .populate('productCategory', 'categoryName')
        .exec();

    // Loop through the products and options to add rows to the worksheet
    products.forEach((product, index) => {
        product.productOption.forEach((option) => {
            const row = worksheet.addRow({
                stt: index + 1,
                name: product.productName || '',
                type: product.productCategory?.categoryName || '', // Safely access category name
                weights: option.name || '',
                quantity: option.productQuantity || 0,
                price: option.productPrice || 0
            });

            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = {
                    wrapText: true,
                    vertical: 'middle',
                    horizontal: 'center'
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.font = { size: 12 };
            });
            row.height = 20;
        });
    });

    // Return file buffer
    return await workbook.xlsx.writeBuffer();
};

module.exports = {
    exportProductList
};


module.exports = {
    exportProductList
};
