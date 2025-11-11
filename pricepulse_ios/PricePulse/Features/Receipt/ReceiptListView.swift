import SwiftUI

struct ReceiptListView: View {
    @StateObject private var viewModel = ReceiptListViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.receipts.isEmpty {
                    ContentUnavailableView(
                        "No Receipts",
                        systemImage: "receipt",
                        description: Text("Scan your first receipt to get started")
                    )
                } else {
                    List {
                        ForEach(viewModel.receipts) { receipt in
                            NavigationLink {
                                ReceiptDetailView(receipt: receipt)
                            } label: {
                                ReceiptRow(receipt: receipt)
                            }
                        }
                        .onDelete { indexSet in
                            Task {
                                await viewModel.deleteReceipts(at: indexSet)
                            }
                        }
                    }
                    .refreshable {
                        await viewModel.loadReceipts()
                    }
                }
            }
            .navigationTitle("Receipts")
            .task {
                await viewModel.loadReceipts()
            }
            .alert("Error", isPresented: .constant(viewModel.error != nil)) {
                Button("OK") {
                    viewModel.error = nil
                }
            } message: {
                if let error = viewModel.error {
                    Text(error.localizedDescription)
                }
            }
        }
    }
}

struct ReceiptRow: View {
    let receipt: Receipt

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(receipt.storeName)
                    .font(.headline)
                Spacer()
                Text(receipt.totalAmount, format: .currency(code: "USD"))
                    .font(.headline)
                    .foregroundStyle(.blue)
            }

            HStack {
                Text(receipt.transactionDate, style: .date)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let postalCode = receipt.postalCode {
                    Text("•")
                        .foregroundStyle(.secondary)
                    Text(postalCode)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if let itemCount = receipt.lineItems?.count {
                    Text("\(itemCount) items")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct ReceiptDetailView: View {
    let receipt: Receipt

    var body: some View {
        List {
            Section("Store Information") {
                LabeledContent("Store", value: receipt.storeName)
                if let location = receipt.storeLocation {
                    LabeledContent("Location", value: location)
                }
                if let postalCode = receipt.postalCode {
                    LabeledContent("Postal Code", value: postalCode)
                }
                LabeledContent("Date", value: receipt.transactionDate, format: .dateTime)
            }

            Section("Summary") {
                LabeledContent("Total", value: receipt.totalAmount, format: .currency(code: "USD"))
                if let tax = receipt.taxAmount {
                    LabeledContent("Tax", value: tax, format: .currency(code: "USD"))
                }
            }

            if let lineItems = receipt.lineItems {
                Section("Items") {
                    ForEach(lineItems) { item in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(item.productName)
                                    .font(.body)
                                Spacer()
                                Text(item.totalPrice, format: .currency(code: "USD"))
                                    .font(.body)
                                    .fontWeight(.medium)
                            }

                            HStack {
                                Text("\(item.quantity, specifier: "%.2f") × \(item.unitPrice, format: .currency(code: "USD"))")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)

                                if let category = item.category {
                                    Text("•")
                                        .foregroundStyle(.secondary)
                                    Text(category)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .navigationTitle("Receipt Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    ReceiptListView()
}
