import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      id: '1',
      category: 'Orders & Shipping',
      question: 'How do I track my order?',
      answer: 'You can track your order by logging into your account and going to "My Orders". Click on the order number to see detailed tracking information including shipping updates and estimated delivery date.'
    },
    {
      id: '2',
      category: 'Orders & Shipping',
      question: 'What are the shipping costs?',
      answer: 'Shipping costs vary depending on the weight, size, and destination of your order. Free shipping is available on orders over KSh 2,000. You can see exact shipping costs at checkout before placing your order.'
    },
    {
      id: '3',
      category: 'Orders & Shipping',
      question: 'How long does delivery take?',
      answer: 'Delivery times vary by location. Nairobi and major cities typically receive orders within 1-3 business days. Rural areas may take 3-7 business days. Express delivery options are available for urgent orders.'
    },
    {
      id: '4',
      category: 'Payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa, card payments (Visa, Mastercard), and cash on delivery. M-Pesa is the most popular payment method in Kenya and offers instant confirmation.'
    },
    {
      id: '5',
      category: 'Payments',
      question: 'Is it safe to pay online?',
      answer: 'Yes, all online payments are processed through secure, encrypted channels. We use industry-standard SSL encryption and comply with PCI DSS security standards to protect your payment information.'
    },
    {
      id: '6',
      category: 'Returns & Refunds',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy on most items. Items must be in their original condition with tags attached. Some items like electronics and personal care products cannot be returned for hygiene reasons.'
    },
    {
      id: '7',
      category: 'Returns & Refunds',
      question: 'How do I return an item?',
      answer: 'To return an item, go to "My Orders" in your account, select the order, and click "Return Item". Follow the instructions to print a return label and package the item. Our courier will pick it up within 2-3 business days.'
    },
    {
      id: '8',
      category: 'Returns & Refunds',
      question: 'When will I get my refund?',
      answer: 'Refunds are processed within 3-5 business days after we receive your returned item. The refund will be issued to the original payment method. M-Pesa refunds are usually instant, while card refunds may take 3-5 business days to appear on your statement.'
    },
    {
      id: '9',
      category: 'Account & Support',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a password reset link via email. Follow the link to create a new password.'
    },
    {
      id: '10',
      category: 'Account & Support',
      question: 'How do I contact customer service?',
      answer: 'You can contact us through the "Customer Services" section in your account, or call our helpline at +254 700 123 456. Our support team is available Monday to Saturday, 8 AM to 8 PM EAT.'
    },
    {
      id: '11',
      category: 'Products',
      question: 'Are your products genuine?',
      answer: 'Yes, we only sell genuine products from authorized distributors and manufacturers. All products come with manufacturer warranties and we provide authenticity guarantees.'
    },
    {
      id: '12',
      category: 'Products',
      question: 'Do you offer product warranties?',
      answer: 'Most products come with manufacturer warranties. Electronics typically have 1-year warranties, while clothing and accessories may have shorter warranty periods. Warranty terms are listed on each product page.'
    }
  ];

  const categories = [...new Set(faqs.map(faq => faq.category))];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {categories.map((category) => {
        const categoryFaqs = filteredFaqs.filter(faq => faq.category === category);
        if (categoryFaqs.length === 0) return null;

        return (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {categoryFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {filteredFaqs.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.203-2.47" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't find any FAQs matching "{searchTerm}"
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Still need help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Can't find the answer you're looking for? Our customer service team is here to help.
          </p>
          <div className="flex gap-4">
            <Button>Contact Support</Button>
            <Button variant="outline">Live Chat</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQ;